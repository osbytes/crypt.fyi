import { describe, it, expect } from '@jest/globals';
import { parseWhEvents, trimmedWhName } from './webhook.js';

describe('parseWhEvents', () => {
  it('should parse a single event', () => {
    const result = parseWhEvents('read');
    expect(result).toEqual({ r: true, fpk: false, fip: false, b: false });
  });

  it('should parse multiple events', () => {
    const result = parseWhEvents('read,burn');
    expect(result).toEqual({ r: true, fpk: false, fip: false, b: true });
  });

  it('should parse all events', () => {
    const result = parseWhEvents('read,failed-key,failed-ip,burn');
    expect(result).toEqual({ r: true, fpk: true, fip: true, b: true });
  });

  it('should handle whitespace around events', () => {
    const result = parseWhEvents('  read  ,  burn  ,  failed-key  ');
    expect(result).toEqual({ r: true, fpk: true, fip: false, b: true });
  });

  it('should handle empty string (default to no events)', () => {
    const result = parseWhEvents('');
    expect(result).toEqual({ r: false, fpk: false, fip: false, b: false });
  });

  it('should handle whitespace-only string (default to no events)', () => {
    const result = parseWhEvents('   ');
    expect(result).toEqual({ r: false, fpk: false, fip: false, b: false });
  });

  it('should handle empty segments between commas', () => {
    const result = parseWhEvents('read,,burn');
    expect(result).toEqual({ r: true, fpk: false, fip: false, b: true });
  });

  it('should handle duplicate events', () => {
    const result = parseWhEvents('read,read,burn,burn');
    expect(result).toEqual({ r: true, fpk: false, fip: false, b: true });
  });

  it('should throw error for unknown event', () => {
    expect(() => parseWhEvents('read,unknown-event')).toThrow(
      "Unknown webhook event: 'unknown-event'. Valid: read, failed-key, failed-ip, burn",
    );
  });

  it('should handle events in different order', () => {
    const result = parseWhEvents('burn,failed-ip,failed-key,read');
    expect(result).toEqual({ r: true, fpk: true, fip: true, b: true });
  });
});

describe('trimmedWhName', () => {
  it('should return undefined for undefined input', () => {
    expect(trimmedWhName(undefined)).toBeUndefined();
  });

  it('should return undefined for empty string', () => {
    expect(trimmedWhName('')).toBeUndefined();
  });

  it('should return undefined for whitespace-only string', () => {
    expect(trimmedWhName('   ')).toBeUndefined();
  });

  it('should trim whitespace from name', () => {
    expect(trimmedWhName('  my webhook  ')).toBe('my webhook');
  });

  it('should return name as-is when no whitespace', () => {
    expect(trimmedWhName('my-webhook')).toBe('my-webhook');
  });
});
