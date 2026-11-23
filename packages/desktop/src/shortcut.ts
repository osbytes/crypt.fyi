/**
 * Global shortcuts use Tauri accelerator strings (e.g. `CommandOrControl+Shift+K`), which the
 * global-shortcut plugin parses natively. These helpers turn a key press in the settings form
 * into an accelerator and render one for display.
 */

export type KeyPress = Pick<KeyboardEvent, 'code' | 'ctrlKey' | 'metaKey' | 'altKey' | 'shiftKey'>;

export type CaptureResult =
  | { kind: 'pending' }
  | { kind: 'invalid' }
  | { kind: 'ok'; accelerator: string };

const MODIFIER_CODES = new Set([
  'ShiftLeft',
  'ShiftRight',
  'ControlLeft',
  'ControlRight',
  'AltLeft',
  'AltRight',
  'MetaLeft',
  'MetaRight',
  'OSLeft',
  'OSRight',
  'CapsLock',
  'Fn',
]);

const NAMED_KEYS = new Set([
  'Space',
  'Enter',
  'Tab',
  'Backspace',
  'Delete',
  'Insert',
  'Home',
  'End',
  'PageUp',
  'PageDown',
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'Minus',
  'Equal',
  'BracketLeft',
  'BracketRight',
  'Backslash',
  'Semicolon',
  'Quote',
  'Backquote',
  'Comma',
  'Period',
  'Slash',
]);

const MODIFIERS = new Set([
  'CommandOrControl',
  'CmdOrCtrl',
  'CommandOrCtrl',
  'CmdOrControl',
  'Command',
  'Cmd',
  'Super',
  'Control',
  'Ctrl',
  'Alt',
  'Option',
  'Shift',
]);

/** Normalizes a `KeyboardEvent.code` to an accelerator key, or null when it can't be one. */
function keyFromCode(code: string): string | null {
  const letter = /^Key([A-Z])$/.exec(code);
  if (letter) return letter[1];
  const digit = /^Digit([0-9])$/.exec(code);
  if (digit) return digit[1];
  if (/^F([1-9]|1[0-9]|2[0-4])$/.test(code)) return code;
  if (/^Numpad[0-9]$/.test(code)) return code;
  if (NAMED_KEYS.has(code)) return code;
  return null;
}

function isValidKey(key: string): boolean {
  return /^[A-Z0-9]$/.test(key) || keyFromCode(key) === key;
}

export function captureShortcut(press: KeyPress, isMac: boolean): CaptureResult {
  if (MODIFIER_CODES.has(press.code)) return { kind: 'pending' };

  const key = keyFromCode(press.code);
  if (!key) return { kind: 'invalid' };

  // `CommandOrControl` maps to Cmd on macOS and Ctrl elsewhere, so a shortcut recorded on one
  // platform keeps working when settings are reused on another.
  const modifiers: string[] = [];
  if (isMac ? press.metaKey : press.ctrlKey) modifiers.push('CommandOrControl');
  if (isMac && press.ctrlKey) modifiers.push('Control');
  if (!isMac && press.metaKey) modifiers.push('Super');
  if (press.altKey) modifiers.push('Alt');
  if (press.shiftKey) modifiers.push('Shift');

  // Shift alone would swallow ordinary capital letters system-wide.
  if (!isValidShortcutModifiers(modifiers)) return { kind: 'invalid' };

  return { kind: 'ok', accelerator: [...modifiers, key].join('+') };
}

function isValidShortcutModifiers(modifiers: string[]): boolean {
  return modifiers.some((modifier) => modifier !== 'Shift');
}

/** Accepts the accelerator forms this app writes plus the common aliases Tauri understands. */
export function isValidAccelerator(accelerator: string): boolean {
  const parts = accelerator.split('+');
  if (parts.length < 2) return false;
  const key = parts[parts.length - 1];
  const modifiers = parts.slice(0, -1);
  if (!modifiers.every((modifier) => MODIFIERS.has(modifier))) return false;
  if (new Set(modifiers).size !== modifiers.length) return false;
  return isValidShortcutModifiers(modifiers) && isValidKey(key);
}

const MAC_SYMBOLS: Record<string, string> = {
  CommandOrControl: '⌘',
  CmdOrCtrl: '⌘',
  CommandOrCtrl: '⌘',
  CmdOrControl: '⌘',
  Command: '⌘',
  Cmd: '⌘',
  Super: '⌘',
  Control: '⌃',
  Ctrl: '⌃',
  Alt: '⌥',
  Option: '⌥',
  Shift: '⇧',
};

const OTHER_LABELS: Record<string, string> = {
  CommandOrControl: 'Ctrl',
  CmdOrCtrl: 'Ctrl',
  CommandOrCtrl: 'Ctrl',
  CmdOrControl: 'Ctrl',
  Command: 'Super',
  Cmd: 'Super',
  Super: 'Super',
  Control: 'Ctrl',
  Ctrl: 'Ctrl',
  Alt: 'Alt',
  Option: 'Alt',
  Shift: 'Shift',
};

const KEY_LABELS: Record<string, string> = {
  Space: 'Space',
  ArrowUp: '↑',
  ArrowDown: '↓',
  ArrowLeft: '←',
  ArrowRight: '→',
  Minus: '-',
  Equal: '=',
  BracketLeft: '[',
  BracketRight: ']',
  Backslash: '\\',
  Semicolon: ';',
  Quote: "'",
  Backquote: '`',
  Comma: ',',
  Period: '.',
  Slash: '/',
};

export function formatAccelerator(accelerator: string, isMac: boolean): string {
  const parts = accelerator.split('+');
  const key = parts[parts.length - 1];
  const labels = parts
    .slice(0, -1)
    .map((modifier) => (isMac ? MAC_SYMBOLS : OTHER_LABELS)[modifier] ?? modifier);
  labels.push(KEY_LABELS[key] ?? key);
  return labels.join(isMac ? '' : '+');
}
