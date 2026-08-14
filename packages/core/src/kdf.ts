/**
 * Shared KDF parameters for Argon2id (password layer + v2 verification) and
 * legacy PBKDF2-GCM. Production values stay hard by default.
 *
 * Unit tests call {@link useFastKdfForTests} from Jest setup so CI isn't dominated
 * by pure-JS Argon2 / PBKDF2 cost. Ciphertext formats and algorithms are unchanged;
 * only the work factor drops.
 */

export type Argon2Params = {
  t: number;
  m: number;
  p: number;
  dkLen: number;
};

/** OWASP interactive minimum; tuned for in-browser noble Argon2id. */
export const PRODUCTION_ARGON2_CONTENT: Argon2Params = {
  t: 2,
  m: 19456, // 19 MiB
  p: 1,
  dkLen: 64, // ML-KEM-768 seed
};

export const PRODUCTION_ARGON2_VERIFICATION: Argon2Params = {
  t: 2,
  m: 19456, // 19 MiB
  p: 1,
  dkLen: 32,
};

/** Legacy AES-GCM password stretching (2^19). */
export const PRODUCTION_PBKDF2_ITERATIONS = 2 ** 19;

// Minimal Argon2id work: still exercises the real KDF path without ~19 MiB / t=2.
const FAST_ARGON2_BASE = { t: 1, m: 8, p: 1 } as const;
const FAST_PBKDF2_ITERATIONS = 1_000;

let argon2Content: Argon2Params = { ...PRODUCTION_ARGON2_CONTENT };
let argon2Verification: Argon2Params = { ...PRODUCTION_ARGON2_VERIFICATION };
let pbkdf2Iterations = PRODUCTION_PBKDF2_ITERATIONS;

export const getArgon2ContentParams = (): Argon2Params => argon2Content;
export const getArgon2VerificationParams = (): Argon2Params => argon2Verification;
export const getPbkdf2Iterations = (): number => pbkdf2Iterations;

/**
 * Drop KDF work factors for unit tests. Must not be called from production code paths.
 */
export const useFastKdfForTests = (): void => {
  argon2Content = { ...FAST_ARGON2_BASE, dkLen: PRODUCTION_ARGON2_CONTENT.dkLen };
  argon2Verification = { ...FAST_ARGON2_BASE, dkLen: PRODUCTION_ARGON2_VERIFICATION.dkLen };
  pbkdf2Iterations = FAST_PBKDF2_ITERATIONS;
};
