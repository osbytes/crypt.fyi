/**
 * Public surface for the inline encryption algorithms.
 *
 * These live in `types.ts`; re-exported here because every algorithm module and
 * its consumers import from `./encryption`. Defining them twice meant two
 * distinct classes with the same name, so `instanceof DecryptError` succeeded
 * or failed depending on which module the caller happened to import.
 */
export type { Encrypt, Decrypt } from './types';
export { DecryptError, EncryptError } from './types';
