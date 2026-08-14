export const VALID_EVENTS = ['read', 'failed-key', 'failed-ip', 'burn'] as const;

export const EVENT_TO_KEY: Record<(typeof VALID_EVENTS)[number], 'r' | 'fpk' | 'fip' | 'b'> = {
  read: 'r',
  'failed-key': 'fpk',
  'failed-ip': 'fip',
  burn: 'b',
};

export function parseWhEvents(raw: string): { r: boolean; fpk: boolean; fip: boolean; b: boolean } {
  const events = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const flags = { r: false, fpk: false, fip: false, b: false };

  for (const event of events) {
    if (!(event in EVENT_TO_KEY)) {
      throw new Error(`Unknown webhook event: '${event}'. Valid: ${VALID_EVENTS.join(', ')}`);
    }
    flags[EVENT_TO_KEY[event as keyof typeof EVENT_TO_KEY]] = true;
  }

  return flags;
}

export function trimmedWhName(name: string | undefined): string | undefined {
  if (name === undefined) {
    return undefined;
  }

  const trimmedName = name.trim();
  return trimmedName === '' ? undefined : trimmedName;
}
