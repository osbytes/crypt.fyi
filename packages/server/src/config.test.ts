import { describe, it, expect } from 'vitest';
import { envBoolean } from './config.js';

describe('boolean environment variables', () => {
  it.each([
    ['true', true],
    ['TRUE', true],
    ['1', true],
    ['yes', true],
    ['on', true],
    ['false', false],
    ['FALSE', false],
    ['0', false],
    ['no', false],
    ['off', false],
    [' false ', false],
  ])('reads %s as %s', (input, expected) => {
    expect(envBoolean(true).parse(input)).toBe(expected);
    expect(envBoolean(false).parse(input)).toBe(expected);
  });

  it('falls back to the default when unset or unrecognised', () => {
    expect(envBoolean(true).parse(undefined)).toBe(true);
    expect(envBoolean(false).parse(undefined)).toBe(false);
    expect(envBoolean(true).parse('')).toBe(true);
    expect(envBoolean(false).parse('maybe')).toBe(false);
  });

  it('does not treat every non-empty string as true', () => {
    // z.coerce.boolean() is Boolean(value), so "false" came out true — which
    // silently enabled retention, telemetry, and https-only webhooks.
    expect(envBoolean(true).parse('false')).toBe(false);
    expect(envBoolean(true).parse('0')).toBe(false);
  });
});
