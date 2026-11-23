const MINUTE = 1000 * 60;
const HOUR = MINUTE * 60;
const DAY = HOUR * 24;

/** Same durations the web client and extension offer, so links behave the same everywhere. */
export const TTL_OPTIONS = [
  { value: 5 * MINUTE, unit: 'minute', count: 5 },
  { value: 30 * MINUTE, unit: 'minute', count: 30 },
  { value: HOUR, unit: 'hour', count: 1 },
  { value: 4 * HOUR, unit: 'hour', count: 4 },
  { value: 12 * HOUR, unit: 'hour', count: 12 },
  { value: DAY, unit: 'day', count: 1 },
  { value: 3 * DAY, unit: 'day', count: 3 },
  { value: 7 * DAY, unit: 'day', count: 7 },
] as const;

export type TtlUnit = (typeof TTL_OPTIONS)[number]['unit'];

/** Matches the web client and extension; the key is the high-entropy half of the link. */
export const KEY_LENGTH = 32;

export const DEFAULT_API_URL = 'https://api.crypt.fyi';
export const DEFAULT_WEB_URL = 'https://crypt.fyi';
/** Four keys so it is unlikely to collide with an app's own shortcuts. */
export const DEFAULT_SHORTCUT = 'CommandOrControl+Alt+Shift+E';
export const DEFAULT_TTL = 30 * MINUTE;
