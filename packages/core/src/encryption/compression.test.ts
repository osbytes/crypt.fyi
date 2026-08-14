import { randomBytes } from '@noble/hashes/utils';
import { Buffer } from '../buffer';
import {
  COMPRESSION_RATIO_THRESHOLD,
  chooseCompressionAlgorithm,
  estimateCompressionRatio,
} from './compression';

const text = (size: number) =>
  'the quick brown fox jumps over the lazy dog. '.repeat(Math.ceil(size / 45)).slice(0, size);

/**
 * Stands in for an already-compressed file: a jpeg, a zip, an mp4. Generated in
 * chunks because WebCrypto refuses more than 65,536 bytes per call.
 */
const incompressible = (size: number) => {
  const chunks: Uint8Array[] = [];
  for (let remaining = size; remaining > 0; remaining -= 65_536) {
    chunks.push(randomBytes(Math.min(remaining, 65_536)));
  }
  return Buffer.concat(chunks.map((chunk) => Buffer.from(chunk))).toString('base64');
};

describe('compression choice', () => {
  it('compresses repetitive text', () => {
    expect(chooseCompressionAlgorithm(text(64 * 1024))).toBe('zlib:pako');
  });

  it('skips compression for high-entropy content', () => {
    // base64 of random bytes deflates to ~75%, exactly what the following
    // base64 expansion undoes — so compressing it is pure cost.
    expect(chooseCompressionAlgorithm(incompressible(256 * 1024))).toBe('none');
  });

  it('always compresses small payloads, where the sample would be noise', () => {
    expect(chooseCompressionAlgorithm(incompressible(512))).toBe('zlib:pako');
    expect(chooseCompressionAlgorithm('short secret')).toBe('zlib:pako');
  });

  it('measures a ratio that reflects the content', () => {
    const repetitive = estimateCompressionRatio(new TextEncoder().encode(text(64 * 1024)));
    const random = estimateCompressionRatio(new TextEncoder().encode(incompressible(64 * 1024)));

    expect(repetitive).toBeLessThan(0.1);
    expect(random).toBeGreaterThan(COMPRESSION_RATIO_THRESHOLD);
    expect(random).toBeLessThanOrEqual(1);
  });

  it('treats empty content as incompressible rather than dividing by zero', () => {
    expect(estimateCompressionRatio(new Uint8Array(0))).toBe(1);
  });

  it('keeps the threshold below the base64 break-even point', () => {
    // Deflate must do better than 0.75 for compression to be worth anything
    // once its output is base64-encoded.
    expect(COMPRESSION_RATIO_THRESHOLD).toBeLessThan(0.75);
  });
});
