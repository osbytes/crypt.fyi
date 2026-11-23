import '@crypt.fyi/theme/fonts/inter';
import '@crypt.fyi/theme/fonts/space-grotesk';
import '@crypt.fyi/theme/fonts/jetbrains-mono';
import './styles.css';

import { Client, supportedLanguages } from '@crypt.fyi/core';
import {
  applyResolvedTheme,
  isThemePreference,
  readStoredPreference,
  resolveTheme,
  subscribeToSystemTheme,
  systemPrefersDark,
  writeStoredPreference,
} from '@crypt.fyi/theme';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { readText, writeText } from '@tauri-apps/plugin-clipboard-manager';
import { register, unregister, type ShortcutEvent } from '@tauri-apps/plugin-global-shortcut';
import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from '@tauri-apps/plugin-notification';

import { KEY_LENGTH, TTL_OPTIONS } from './config';
import { createTranslator, resolveLanguage, type Translate, type TranslationKey } from './i18n';
import { buildCreateInput, buildSecretUrl, describeCreateError } from './secret';
import {
  DEFAULT_SETTINGS,
  clearSettings,
  loadSettings,
  parseSettings,
  saveSettings,
  type Settings,
  type SettingsError,
} from './settings';
import { captureShortcut, formatAccelerator } from './shortcut';

type View = 'create' | 'result' | 'settings';

function byId<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing #${id}`);
  return element as T;
}

const el = {
  alert: byId<HTMLParagraphElement>('alert'),
  openSettings: byId<HTMLButtonElement>('open-settings'),
  views: {
    create: byId<HTMLElement>('view-create'),
    result: byId<HTMLElement>('view-result'),
    settings: byId<HTMLElement>('view-settings'),
  },
  createForm: byId<HTMLFormElement>('create-form'),
  content: byId<HTMLTextAreaElement>('content'),
  clipboardHint: byId<HTMLSpanElement>('clipboard-hint'),
  password: byId<HTMLInputElement>('password'),
  ttl: byId<HTMLSelectElement>('ttl'),
  burn: byId<HTMLInputElement>('burn'),
  createSubmit: byId<HTMLButtonElement>('create-submit'),
  shortcutHint: byId<HTMLParagraphElement>('shortcut-hint'),
  resultUrl: byId<HTMLInputElement>('result-url'),
  resultTitle: byId<HTMLHeadingElement>('result-title'),
  passwordReminder: byId<HTMLParagraphElement>('password-reminder'),
  resultDone: byId<HTMLButtonElement>('result-done'),
  settingsForm: byId<HTMLFormElement>('settings-form'),
  apiUrl: byId<HTMLInputElement>('apiUrl'),
  webUrl: byId<HTMLInputElement>('webUrl'),
  shortcut: byId<HTMLInputElement>('shortcut'),
  defaultTtl: byId<HTMLSelectElement>('default-ttl'),
  defaultBurn: byId<HTMLInputElement>('default-burn'),
  prefill: byId<HTMLInputElement>('prefill'),
  language: byId<HTMLSelectElement>('language'),
  theme: byId<HTMLSelectElement>('theme'),
  settingsBack: byId<HTMLButtonElement>('settings-back'),
  settingsReset: byId<HTMLButtonElement>('settings-reset'),
  settingsStatus: byId<HTMLParagraphElement>('settings-status'),
};

const isMac = /Mac/i.test(navigator.userAgent);
const appWindow = getCurrentWindow();

let settings: Settings = loadSettings(localStorage);
let t: Translate = createTranslator(resolveLanguage(settings.language, navigator.languages));
let currentView: View = 'create';
let busy = false;

// ---------------------------------------------------------------------------
// Localization and theme
// ---------------------------------------------------------------------------

function applyLanguage() {
  const language = resolveLanguage(settings.language, navigator.languages);
  t = createTranslator(language);
  document.documentElement.lang = language;

  // Keys come from our own markup, so a typo shows up as the raw key rather than failing.
  const attributes = [
    ['i18n', null],
    ['i18nPlaceholder', 'placeholder'],
    ['i18nTitle', 'title'],
    ['i18nAriaLabel', 'aria-label'],
  ] as const;
  for (const [dataKey, attribute] of attributes) {
    const selector = `[data-${dataKey.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}]`;
    for (const node of document.querySelectorAll<HTMLElement>(selector)) {
      const text = t(node.dataset[dataKey] as TranslationKey);
      if (attribute) node.setAttribute(attribute, text);
      else node.textContent = text;
    }
  }

  for (const select of [el.ttl, el.defaultTtl]) {
    const selected = select.value;
    select.replaceChildren(
      ...TTL_OPTIONS.map(
        (option) =>
          new Option(
            t(`common.time.${option.unit}`, { count: option.count }),
            String(option.value),
          ),
      ),
    );
    if (selected) select.value = selected;
  }

  const selectedLanguage = el.language.value || settings.language;
  el.language.replaceChildren(
    new Option(t('desktop.settings.languageSystem'), 'system'),
    ...Object.entries(supportedLanguages).map(([code, name]) => new Option(name, code)),
  );
  el.language.value = selectedLanguage;

  el.shortcutHint.textContent = t('desktop.create.shortcutHint', {
    shortcut: formatAccelerator(settings.shortcut, isMac),
  });
  if (document.activeElement !== el.shortcut) renderShortcutField();

  invoke('set_tray_labels', {
    newSecret: t('desktop.tray.newSecret'),
    settings: t('desktop.tray.settings'),
    quit: t('desktop.tray.quit'),
  }).catch(() => {
    // The tray keeps its built-in English labels.
  });
}

function renderTheme() {
  applyResolvedTheme(resolveTheme(readStoredPreference(), systemPrefersDark()));
}

// ---------------------------------------------------------------------------
// Views and window
// ---------------------------------------------------------------------------

function showAlert(message: string | null) {
  el.alert.textContent = message ?? '';
  el.alert.classList.toggle('hidden', !message);
}

function showView(view: View) {
  currentView = view;
  for (const [name, section] of Object.entries(el.views)) {
    section.hidden = name !== view;
  }
  el.openSettings.classList.toggle('invisible', view === 'settings');
  if (view === 'settings') {
    el.settingsStatus.classList.add('hidden');
    fillSettingsForm();
    el.apiUrl.focus();
  }
}

/**
 * Drops plaintext, password and the last link from the DOM. JavaScript strings can't be
 * zeroed, but nothing keeps a reference after this, and nothing is ever written to storage.
 */
function resetCreateForm() {
  el.content.value = '';
  el.password.value = '';
  el.resultUrl.value = '';
  el.clipboardHint.classList.add('hidden');
  el.ttl.value = String(settings.ttl);
  el.burn.checked = settings.burn;
}

async function showWindow() {
  await appWindow.unminimize();
  await appWindow.show();
  await appWindow.setFocus();
}

async function hideWindow() {
  resetCreateForm();
  showAlert(null);
  showView('create');
  await appWindow.hide();
}

async function openCreate() {
  resetCreateForm();
  showAlert(null);
  showView('create');

  if (settings.prefillFromClipboard) {
    let text = '';
    try {
      text = await readText();
    } catch {
      // Empty or non-text clipboard: start with a blank form.
    }
    if (text.trim()) {
      el.content.value = text;
      el.clipboardHint.classList.remove('hidden');
    }
  }

  el.content.focus();
  el.content.select();
}

async function toggleFromShortcut() {
  if ((await appWindow.isVisible()) && (await appWindow.isFocused())) {
    await hideWindow();
    return;
  }
  await openCreate();
  await showWindow();
  el.content.focus();
}

// ---------------------------------------------------------------------------
// Global shortcut
// ---------------------------------------------------------------------------

let registeredShortcut: string | null = null;
// Registration is async and native; serializing it keeps focus/blur/save from interleaving.
let shortcutQueue: Promise<unknown> = Promise.resolve();

function onShortcut(event: ShortcutEvent) {
  if (event.state === 'Pressed') void toggleFromShortcut();
}

function queueShortcut(next: string | null): Promise<boolean> {
  const task = shortcutQueue.then(async () => {
    if (registeredShortcut === next) return true;
    const previous = registeredShortcut;
    if (previous) {
      await unregister(previous).catch(() => {});
      registeredShortcut = null;
    }
    if (!next) return true;
    try {
      await register(next, onShortcut);
      registeredShortcut = next;
      return true;
    } catch {
      if (previous) {
        await register(previous, onShortcut)
          .then(() => {
            registeredShortcut = previous;
          })
          .catch(() => {});
      }
      return false;
    }
  });
  shortcutQueue = task;
  return task;
}

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

function setBusy(next: boolean) {
  busy = next;
  el.createSubmit.disabled = next;
  el.createSubmit.textContent = t(next ? 'desktop.create.submitting' : 'desktop.create.submit');
}

/** The link is never put in the notification: notification centers keep a history. */
async function notifyCopied(passwordProtected: boolean): Promise<boolean> {
  try {
    let granted = await isPermissionGranted();
    if (!granted) granted = (await requestPermission()) === 'granted';
    if (!granted) return false;
    const body = t('desktop.result.notificationBody');
    sendNotification({
      title: t('desktop.result.notificationTitle'),
      body: passwordProtected ? `${body} ${t('desktop.result.passwordReminder')}` : body,
    });
    return true;
  } catch {
    return false;
  }
}

function showResult(url: string, passwordProtected: boolean, copied: boolean) {
  showView('result');
  el.resultUrl.value = url;
  el.resultTitle.classList.toggle('hidden', !copied);
  el.passwordReminder.classList.toggle('hidden', !passwordProtected);
  showAlert(copied ? null : t('desktop.errors.clipboard'));
  el.resultUrl.focus();
  el.resultUrl.select();
}

async function handleCreate(event: SubmitEvent) {
  event.preventDefault();
  if (busy) return;

  const result = buildCreateInput({
    content: el.content.value,
    password: el.password.value,
    ttl: Number(el.ttl.value),
    burn: el.burn.checked,
  });
  if (!result.ok) {
    showAlert(t(result.error === 'empty' ? 'desktop.create.emptyError' : 'desktop.errors.unknown'));
    el.content.focus();
    return;
  }

  showAlert(null);
  setBusy(true);
  const { apiUrl, webUrl } = settings;
  const passwordProtected = result.input.p !== undefined;
  let url: string;
  try {
    // Encryption, key generation and hashing all happen here, in the webview; the server
    // only receives ciphertext and a verification hash.
    const client = new Client({
      apiUrl,
      keyLength: KEY_LENGTH,
      xClient: `@crypt.fyi/desktop:${__APP_VERSION__}`,
    });
    const created = await client.create(result.input);
    url = buildSecretUrl({ webUrl, id: created.id, key: created.key, passwordProtected });
  } catch (error) {
    const message = describeCreateError(error, apiUrl);
    showAlert(t(message.key, message.vars));
    setBusy(false);
    return;
  }

  resetCreateForm();
  setBusy(false);

  let copied = true;
  try {
    // Overwriting the clipboard also removes the plaintext that may have been prefilled from it.
    await writeText(url);
  } catch {
    copied = false;
  }

  if (copied && (await notifyCopied(passwordProtected))) {
    await hideWindow();
    return;
  }
  showResult(url, passwordProtected, copied);
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

function renderShortcutField() {
  const accelerator = el.shortcut.dataset.accelerator ?? settings.shortcut;
  el.shortcut.value = formatAccelerator(accelerator, isMac);
  el.shortcut.placeholder = '';
}

function fillSettingsForm() {
  el.apiUrl.value = settings.apiUrl;
  el.webUrl.value = settings.webUrl;
  el.shortcut.dataset.accelerator = settings.shortcut;
  renderShortcutField();
  el.defaultTtl.value = String(settings.ttl);
  el.defaultBurn.checked = settings.burn;
  el.prefill.checked = settings.prefillFromClipboard;
  el.language.value = settings.language;
  el.theme.value = readStoredPreference();
}

function describeSettingsError(error: SettingsError): string {
  if (error.message === 'invalidShortcut') return t('desktop.settings.invalidShortcut');
  const field =
    error.field === 'apiUrl' ? t('desktop.settings.apiUrl') : t('desktop.settings.webUrl');
  return t('desktop.settings.invalidUrl', { field });
}

async function applySettings(next: Settings, theme: string) {
  if (!(await queueShortcut(next.shortcut))) {
    showAlert(
      t('desktop.errors.shortcutUnavailable', {
        shortcut: formatAccelerator(next.shortcut, isMac),
      }),
    );
    return false;
  }
  settings = next;
  if (isThemePreference(theme)) writeStoredPreference(theme);
  renderTheme();
  applyLanguage();
  resetCreateForm();
  showAlert(null);
  el.settingsStatus.textContent = t('desktop.settings.saved');
  el.settingsStatus.classList.remove('hidden');
  return true;
}

async function handleSaveSettings(event: SubmitEvent) {
  event.preventDefault();
  el.settingsStatus.classList.add('hidden');

  const { settings: next, errors } = parseSettings({
    apiUrl: el.apiUrl.value,
    webUrl: el.webUrl.value,
    shortcut: el.shortcut.dataset.accelerator,
    ttl: Number(el.defaultTtl.value),
    burn: el.defaultBurn.checked,
    prefillFromClipboard: el.prefill.checked,
    language: el.language.value,
  });
  if (errors.length > 0) {
    showAlert(errors.map(describeSettingsError).join('\n'));
    return;
  }

  if (await applySettings(next, el.theme.value)) {
    saveSettings(localStorage, next);
    fillSettingsForm();
  }
}

async function handleResetSettings() {
  el.settingsStatus.classList.add('hidden');
  if (await applySettings({ ...DEFAULT_SETTINGS }, 'system')) {
    clearSettings(localStorage);
    fillSettingsForm();
  }
}

function handleShortcutKeydown(event: KeyboardEvent) {
  event.preventDefault();
  event.stopPropagation();
  if (event.code === 'Escape' && !event.ctrlKey && !event.metaKey && !event.altKey) {
    el.shortcut.blur();
    return;
  }
  const result = captureShortcut(event, isMac);
  if (result.kind === 'pending') return;
  if (result.kind === 'invalid') {
    showAlert(t('desktop.settings.invalidShortcut'));
    return;
  }
  showAlert(null);
  el.shortcut.dataset.accelerator = result.accelerator;
  el.shortcut.blur();
}

// ---------------------------------------------------------------------------
// Wiring
// ---------------------------------------------------------------------------

el.createForm.addEventListener('submit', (event) => void handleCreate(event));
el.content.addEventListener('keydown', (event) => {
  // Cmd/Ctrl+Enter submits without leaving the keyboard; plain Enter keeps adding lines.
  if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
    event.preventDefault();
    el.createForm.requestSubmit();
  }
});
el.openSettings.addEventListener('click', () => showView('settings'));
el.resultDone.addEventListener('click', () => void hideWindow());
el.settingsForm.addEventListener('submit', (event) => void handleSaveSettings(event));
el.settingsBack.addEventListener('click', () => {
  showAlert(null);
  showView('create');
});
el.settingsReset.addEventListener('click', () => void handleResetSettings());

// Recording a shortcut must not trigger the one currently registered.
el.shortcut.addEventListener('focus', () => {
  void queueShortcut(null);
  el.shortcut.value = '';
  el.shortcut.placeholder = t('desktop.settings.shortcutRecording');
});
el.shortcut.addEventListener('blur', () => {
  renderShortcutField();
  void queueShortcut(settings.shortcut);
});
el.shortcut.addEventListener('keydown', handleShortcutKeydown);

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && document.activeElement !== el.shortcut) {
    event.preventDefault();
    if (currentView === 'settings') {
      showAlert(null);
      showView('create');
    } else {
      void hideWindow();
    }
  }
});

subscribeToSystemTheme(renderTheme);

void listen<string>('crypt://open', async (event) => {
  if (event.payload === 'settings') {
    showAlert(null);
    showView('settings');
  } else {
    await openCreate();
  }
});
void listen('crypt://hidden', () => {
  resetCreateForm();
  showAlert(null);
  showView('create');
});

async function start() {
  renderTheme();
  applyLanguage();
  resetCreateForm();
  showView('create');

  const registered = await queueShortcut(settings.shortcut);
  if (!registered) {
    showView('settings');
    showAlert(
      t('desktop.errors.shortcutUnavailable', {
        shortcut: formatAccelerator(settings.shortcut, isMac),
      }),
    );
  }
  // Launching the app is an explicit action, so show the window once; afterwards it lives in
  // the tray and opens with the shortcut.
  await showWindow();
  if (registered) el.content.focus();
}

void start();
