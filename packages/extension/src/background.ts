import browser, { Menus } from 'webextension-polyfill';
import { Client } from '@crypt.fyi/core';
import { config } from './config';

const manifest = chrome.runtime.getManifest();

const client = new Client({
  apiUrl: config.apiUrl,
  keyLength: config.keyLength,
  xClient: `@crypt.fyi/extension:${manifest.version}`,
});

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

function isScriptableUrl(url: string): boolean {
  return url.startsWith('http://') || url.startsWith('https://');
}

browser.contextMenus.onClicked.addListener(async (info: Menus.OnClickData, tab) => {
  if (info.menuItemId !== contextMenuId || !info.selectionText || !tab?.id || !tab.url) {
    return;
  }

  const tabId = tab.id;

  if (!isScriptableUrl(tab.url)) {
    return;
  }

  // TODO: add an inline popover form w/ content script to capture relevant inputs

  try {
    const result = await client.create({
      c: info.selectionText,
      b: true,
      ttl: config.defaultTtl,
    });
    const url = `${config.webUrl}/${result.id}?key=${result.key}`;

    await chrome.scripting.executeScript({
      target: { tabId },
      func: (textToCopy: string) => {
        async function copyToClipboard(text: string): Promise<boolean> {
          try {
            await navigator.clipboard.writeText(text);
            return true;
          } catch (err) {
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            try {
              const success = document.execCommand('copy');
              textArea.remove();
              return success;
            } catch (e) {
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
