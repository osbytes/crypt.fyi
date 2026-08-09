import './styles.css';
import { TTL_OPTIONS, type ConfigOverride, type ExtensionConfig } from '../config';
import { parseConfigOverride } from '../configSchema';
import { clearUserConfig, resolveConfig, saveUserConfig } from '../resolveConfig';

const form = document.getElementById('settings-form') as HTMLFormElement;
const statusEl = document.getElementById('status') as HTMLParagraphElement;
const errorsEl = document.getElementById('errors') as HTMLParagraphElement;
const ttlSelect = document.getElementById('ttl') as HTMLSelectElement;
const burnInput = document.getElementById('burn') as HTMLInputElement;
const rcInput = document.getElementById('rc') as HTMLInputElement;
const resetBtn = document.getElementById('reset-btn') as HTMLButtonElement;
const exportBtn = document.getElementById('export-btn') as HTMLButtonElement;
const importInput = document.getElementById('import-input') as HTMLInputElement;

function setStatus(message: string | null) {
  if (!message) {
    statusEl.classList.add('hidden');
    statusEl.textContent = '';
    return;
  }
  statusEl.classList.remove('hidden');
  statusEl.textContent = message;
}

function setErrors(messages: string[]) {
  if (messages.length === 0) {
    errorsEl.classList.add('hidden');
    errorsEl.textContent = '';
    return;
  }
  errorsEl.classList.remove('hidden');
  errorsEl.textContent = messages.join('\n');
}

/** Ensure the select always has the supported TTL choices (HTML may already include them). */
function fillTtlOptions() {
  const existing = new Set(Array.from(ttlSelect.options).map((option) => option.value));

  for (const option of TTL_OPTIONS) {
    const value = String(option.value);
    if (existing.has(value)) continue;
    const el = document.createElement('option');
    el.value = value;
    el.textContent = option.label;
    ttlSelect.append(el);
  }
}

function findClosestTtl(ttl: number): number {
  let closest = TTL_OPTIONS[0].value;
  let best = Math.abs(ttl - closest);
  for (const option of TTL_OPTIONS) {
    const distance = Math.abs(ttl - option.value);
    if (distance < best) {
      closest = option.value;
      best = distance;
    }
  }
  return closest;
}

function syncBurnUi() {
  const burned = burnInput.checked;
  rcInput.disabled = burned;
  if (burned) {
    rcInput.value = '';
  }
}

function applyConfigToForm(config: ExtensionConfig) {
  (document.getElementById('apiUrl') as HTMLInputElement).value = config.apiUrl;
  (document.getElementById('webUrl') as HTMLInputElement).value = config.webUrl;
  // Setting a value that is not in <option>s blanks the select — snap to closest.
  ttlSelect.value = String(findClosestTtl(config.ttl));
  burnInput.checked = config.burn;
  (document.getElementById('ips') as HTMLInputElement).value = config.ips ?? '';
  rcInput.value = config.rc != null ? String(config.rc) : '';
  (document.getElementById('fc') as HTMLInputElement).value =
    config.fc != null ? String(config.fc) : '';
  (document.getElementById('webhookUrl') as HTMLInputElement).value = config.webhookUrl ?? '';
  (document.getElementById('webhookName') as HTMLInputElement).value = config.webhookName ?? '';
  (document.getElementById('webhookOnRead') as HTMLInputElement).checked = config.webhookOnRead;
  (document.getElementById('webhookOnFailPassword') as HTMLInputElement).checked =
    config.webhookOnFailPassword;
  (document.getElementById('webhookOnFailIp') as HTMLInputElement).checked = config.webhookOnFailIp;
  (document.getElementById('webhookOnBurn') as HTMLInputElement).checked = config.webhookOnBurn;
  syncBurnUi();
}

function readFormOverride(): ConfigOverride {
  const ips = (document.getElementById('ips') as HTMLInputElement).value.trim();
  const rcRaw = rcInput.value.trim();
  const fcRaw = (document.getElementById('fc') as HTMLInputElement).value.trim();
  const webhookUrl = (document.getElementById('webhookUrl') as HTMLInputElement).value.trim();
  const webhookName = (document.getElementById('webhookName') as HTMLInputElement).value.trim();
  const burn = burnInput.checked;

  // Persist empties as null so users can clear organization-seeded optionals.
  return {
    apiUrl: (document.getElementById('apiUrl') as HTMLInputElement).value.trim(),
    webUrl: (document.getElementById('webUrl') as HTMLInputElement).value.trim(),
    ttl: Number(ttlSelect.value),
    burn,
    ips: ips || null,
    rc: burn ? null : rcRaw ? Number(rcRaw) : null,
    fc: fcRaw ? Number(fcRaw) : null,
    webhookUrl: webhookUrl || null,
    webhookName: webhookName || null,
    webhookOnRead: (document.getElementById('webhookOnRead') as HTMLInputElement).checked,
    webhookOnFailPassword: (document.getElementById('webhookOnFailPassword') as HTMLInputElement)
      .checked,
    webhookOnFailIp: (document.getElementById('webhookOnFailIp') as HTMLInputElement).checked,
    webhookOnBurn: (document.getElementById('webhookOnBurn') as HTMLInputElement).checked,
  };
}

async function refresh() {
  const resolved = await resolveConfig();
  applyConfigToForm(resolved.config);
  setErrors(resolved.parseErrors);
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const override = readFormOverride();
  const { data, errors } = parseConfigOverride(override);
  if (errors.length > 0) {
    setErrors(errors);
    setStatus(null);
    return;
  }

  const saveErrors = await saveUserConfig(data);
  if (saveErrors.length > 0) {
    setErrors(saveErrors);
    return;
  }

  await refresh();
  setStatus('Settings saved.');
});

burnInput.addEventListener('change', syncBurnUi);

resetBtn.addEventListener('click', async () => {
  await clearUserConfig();
  await refresh();
  setStatus('Settings reset to defaults.');
});

exportBtn.addEventListener('click', async () => {
  const resolved = await resolveConfig();
  const payload = {
    apiUrl: resolved.config.apiUrl,
    webUrl: resolved.config.webUrl,
    ttl: resolved.config.ttl,
    burn: resolved.config.burn,
    ...(resolved.config.ips ? { ips: resolved.config.ips } : {}),
    ...(resolved.config.rc != null ? { rc: resolved.config.rc } : {}),
    ...(resolved.config.fc != null ? { fc: resolved.config.fc } : {}),
    ...(resolved.config.webhookUrl ? { webhookUrl: resolved.config.webhookUrl } : {}),
    ...(resolved.config.webhookName ? { webhookName: resolved.config.webhookName } : {}),
    webhookOnRead: resolved.config.webhookOnRead,
    webhookOnFailPassword: resolved.config.webhookOnFailPassword,
    webhookOnFailIp: resolved.config.webhookOnFailIp,
    webhookOnBurn: resolved.config.webhookOnBurn,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'crypt-fyi-extension-config.json';
  a.click();
  URL.revokeObjectURL(url);
});

importInput.addEventListener('change', async () => {
  const file = importInput.files?.[0];
  importInput.value = '';
  if (!file) return;

  try {
    const text = await file.text();
    const json: unknown = JSON.parse(text);
    const { data, errors } = parseConfigOverride(json);
    if (Object.keys(data).length === 0) {
      setErrors(errors.length > 0 ? errors : ['Import file contained no valid settings']);
      return;
    }
    const saveErrors = await saveUserConfig(data);
    await refresh();
    setErrors([...errors, ...saveErrors]);
    setStatus('Settings imported.');
  } catch (error) {
    setErrors([error instanceof Error ? error.message : 'Failed to import JSON']);
  }
});

fillTtlOptions();
void refresh();
