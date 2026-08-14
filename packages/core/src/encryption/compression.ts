import { deflate } from 'pako';
import type { ProcessingMetadata } from '../vault';

/**
 * Picks a compression algorithm for a payload.
 *
 * `processContent` base64-encodes the deflate output before encrypting it, so
 * compression only pays off when deflate beats the 1.333x expansion that
 * follows. On high-entropy input — an image, an archive, an encrypted file —
 * deflate lands at roughly 75% and the base64 round-trip gives all of it back,
 * leaving the payload the same size for many times the CPU. Measured on 25 MB
 * of random bytes: 44.89 MB in 1628 ms compressed, against 44.45 MB in 112 ms
 * uncompressed.
 *
 * Text still compresses enormously (the same measurement is 0.06 MB vs 44 MB),
 * so the choice is made per payload rather than turned off outright. It is
 * recorded in the entry's metadata, and readers already honour `none`, so this
 * needs no format change and no migration.
 */

/** Deflate must beat this ratio to survive the base64 that follows it. */
const BASE64_BREAK_EVEN = 1 / (4 / 3);
/** Require a real win, not a rounding one. */
const MARGIN = 0.95;
export const COMPRESSION_RATIO_THRESHOLD = BASE64_BREAK_EVEN * MARGIN;

/** Enough to classify a payload without deflating all of it. */
export const COMPRESSION_SAMPLE_BYTES = 64 * 1024;

/** Below this, the sample is not representative and deflate is cheap anyway. */
const MIN_SIZE_TO_SAMPLE = 4 * 1024;

export type CompressionAlgorithmName = NonNullable<ProcessingMetadata['compression']>['algorithm'];

/**
 * Estimates deflate's ratio on a prefix of the content.
 * Returns compressed/original — lower is better.
 */
export const estimateCompressionRatio = (content: Uint8Array): number => {
  if (content.length === 0) {
    return 1;
  }
  const sample = content.subarray(0, Math.min(content.length, COMPRESSION_SAMPLE_BYTES));
  return deflate(sample).length / sample.length;
};

export const chooseCompressionAlgorithm = (content: string): CompressionAlgorithmName => {
  const bytes = new TextEncoder().encode(content);

  // Small payloads are dominated by deflate's own header; the sample would be
  // noise, and the absolute cost either way is negligible.
  if (bytes.length < MIN_SIZE_TO_SAMPLE) {
    return 'zlib:pako';
  }

  return estimateCompressionRatio(bytes) < COMPRESSION_RATIO_THRESHOLD ? 'zlib:pako' : 'none';
};
