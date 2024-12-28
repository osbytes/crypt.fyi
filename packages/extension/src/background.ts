import browser, { Menus } from 'webextension-polyfill';
import {
  CreateVaultResponse,
  encrypt,
  generateRandomString,
  sha256,
  type CreateVaultRequest,
} from '@crypt.fyi/core';
import { config } from './config';

const contextMenuId = '@crypt.fyi/encrypt-selection';

browser.contextMenus.create({
  id: contextMenuId,
  title: 'Encrypt and Share with crypt.fyi',
  contexts: ['selection'],
});

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
    const key = await generateRandomString(config.keyLength);
    const encrypted = await encrypt(info.selectionText, key);
    const hash = sha256(key);

    const manifest = chrome.runtime.getManifest();
    const response = await fetch(`${config.apiUrl}/vault`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Client': `@crypt.fyi/extension:${manifest.version}`,
      },
      body: JSON.stringify({
        c: encrypted,
        h: hash,
        b: true,
        ttl: config.defaultTtl,
      } satisfies CreateVaultRequest),
    });

    if (!response.ok) {
      throw new Error(`Failed to create vault: ${response.statusText}`);
    }

    const { id } = (await response.json()) as CreateVaultResponse;
    const url = `${config.webUrl}/${id}?key=${key}`;

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
      iconUrl: chrome.runtime.getURL('icon-48.png'),
      title: 'Text Encrypted',
      message:
        'The text has been encrypted and the secret URL has been copied to your clipboard. Send to the intended recipient.',
    });
  } catch (error) {
    console.error('[crypt.fyi] Encryption failed:', error);

    try {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: chrome.runtime.getURL('icon-48.png'),
        title: 'Encryption Failed',
        message: error instanceof Error ? error.message : 'An unknown error occurred',
      });
    } catch (notificationError) {
      console.error('[crypt.fyi] Failed to show error notification:', notificationError);
    }
  }
});
