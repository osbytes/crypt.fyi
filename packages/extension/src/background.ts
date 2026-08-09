import browser, { Menus } from 'webextension-polyfill';
import { Client } from '@crypt.fyi/core';
import { KEY_LENGTH } from './config';
import { resolveConfig, toCreateOptions } from './resolveConfig';

const contextMenuId = '@crypt.fyi/encrypt-selection';

browser.contextMenus.remove(contextMenuId).catch(() => {});
browser.contextMenus.create(
  {
    id: contextMenuId,
    title: 'Encrypt and Share with crypt.fyi',
    contexts: ['selection'],
  },
  () => {
    const error = browser.runtime.lastError;
    if (error) {
      console.warn('[crypt.fyi] Context menu creation error:', error);
    }
  },
);

// No default_popup — toolbar click opens the options page for discoverability.
chrome.action.onClicked.addListener(() => {
  void chrome.runtime.openOptionsPage();
});

function isScriptableUrl(url: string): boolean {
  return url.startsWith('http://') || url.startsWith('https://');
}

async function createClient() {
  const { config } = await resolveConfig();
  const manifest = chrome.runtime.getManifest();
  return {
    config,
    client: new Client({
      apiUrl: config.apiUrl,
      keyLength: KEY_LENGTH,
      xClient: `@crypt.fyi/extension:${manifest.version}`,
    }),
  };
}

browser.contextMenus.onClicked.addListener(async (info: Menus.OnClickData, tab) => {
  if (info.menuItemId !== contextMenuId || !info.selectionText || !tab?.id || !tab.url) {
    return;
  }

  const tabId = tab.id;

  if (!isScriptableUrl(tab.url)) {
    return;
  }

  try {
    const { config, client } = await createClient();
    const result = await client.create({
      c: info.selectionText,
      ...toCreateOptions(config),
    });
    const url = `${config.webUrl}/${result.id}#${result.key}`;

    await chrome.scripting.executeScript({
      target: { tabId },
      func: (textToCopy: string) => {
        async function copyToClipboard(text: string): Promise<boolean> {
          try {
            await navigator.clipboard.writeText(text);
            return true;
          } catch {
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            try {
              const success = document.execCommand('copy');
              textArea.remove();
              return success;
            } catch {
              textArea.remove();
              return false;
            }
          }
        }

        copyToClipboard(textToCopy);
      },
      args: [url],
    });

    chrome.notifications.create({
      type: 'basic',
      iconUrl: chrome.runtime.getURL('48.png'),
      title: 'Text Encrypted',
      message: 'Secret URL copied to clipboard. Ready to share.',
    });
  } catch (error) {
    console.error('[crypt.fyi] Encryption failed:', error);

    try {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: chrome.runtime.getURL('48.png'),
        title: 'Encryption Failed',
        message: error instanceof Error ? error.message : 'An unknown error occurred',
      });
    } catch (notificationError) {
      console.error('[crypt.fyi] Failed to show error notification:', notificationError);
    }
  }
});
