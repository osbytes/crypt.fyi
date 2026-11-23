import { describe, expect, it } from 'vitest';
import { captureShortcut, formatAccelerator, isValidAccelerator, type KeyPress } from './shortcut';

const press = (code: string, modifiers: Partial<Omit<KeyPress, 'code'>> = {}): KeyPress => ({
  code,
  ctrlKey: false,
  metaKey: false,
  altKey: false,
  shiftKey: false,
  ...modifiers,
});

describe('captureShortcut', () => {
  it('maps Ctrl on Windows/Linux and Cmd on macOS to CommandOrControl', () => {
    expect(captureShortcut(press('KeyK', { ctrlKey: true, shiftKey: true }), false)).toEqual({
      kind: 'ok',
      accelerator: 'CommandOrControl+Shift+K',
    });
    expect(captureShortcut(press('KeyK', { metaKey: true, shiftKey: true }), true)).toEqual({
      kind: 'ok',
      accelerator: 'CommandOrControl+Shift+K',
    });
  });

  it('keeps the platform-specific modifier when it is not the primary one', () => {
    expect(captureShortcut(press('KeyE', { ctrlKey: true, altKey: true }), true)).toEqual({
      kind: 'ok',
      accelerator: 'Control+Alt+E',
    });
    expect(captureShortcut(press('Digit1', { metaKey: true }), false)).toEqual({
      kind: 'ok',
      accelerator: 'Super+1',
    });
  });

  it('accepts function and punctuation keys', () => {
    expect(captureShortcut(press('F5', { altKey: true }), false)).toEqual({
      kind: 'ok',
      accelerator: 'Alt+F5',
    });
    expect(captureShortcut(press('Period', { ctrlKey: true }), false)).toEqual({
      kind: 'ok',
      accelerator: 'CommandOrControl+Period',
    });
  });

  it('waits while only modifiers are held', () => {
    expect(captureShortcut(press('ShiftLeft', { shiftKey: true }), false)).toEqual({
      kind: 'pending',
    });
    expect(captureShortcut(press('MetaRight', { metaKey: true }), true)).toEqual({
      kind: 'pending',
    });
  });

  it('rejects keys without a modifier, Shift-only combinations and unknown keys', () => {
    expect(captureShortcut(press('KeyA'), false)).toEqual({ kind: 'invalid' });
    expect(captureShortcut(press('KeyA', { shiftKey: true }), false)).toEqual({ kind: 'invalid' });
    expect(captureShortcut(press('IntlRo', { ctrlKey: true }), false)).toEqual({
      kind: 'invalid',
    });
  });
});

describe('isValidAccelerator', () => {
  it.each([
    'CommandOrControl+Alt+Shift+E',
    'CmdOrCtrl+K',
    'Control+Space',
    'Alt+F12',
    'Super+Numpad5',
    'Option+ArrowUp',
  ])('accepts %s', (accelerator) => {
    expect(isValidAccelerator(accelerator)).toBe(true);
  });

  it.each(['', 'K', 'Shift+K', 'Ctrl+Ctrl+K', 'Hyper+K', 'Ctrl+', 'Ctrl+Shift', 'Ctrl+KeyK'])(
    'rejects %j',
    (accelerator) => {
      expect(isValidAccelerator(accelerator)).toBe(false);
    },
  );
});

describe('formatAccelerator', () => {
  it('uses symbols on macOS', () => {
    expect(formatAccelerator('CommandOrControl+Alt+Shift+E', true)).toBe('⌘⌥⇧E');
  });

  it('uses names elsewhere', () => {
    expect(formatAccelerator('CommandOrControl+Alt+Shift+E', false)).toBe('Ctrl+Alt+Shift+E');
    expect(formatAccelerator('Super+Period', false)).toBe('Super+.');
  });
});
