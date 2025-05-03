import { sha256 as nobleSha256 } from '@noble/hashes/sha2';
import { sha512 as nobleSha512 } from '@noble/hashes/sha2';
import { Buffer } from './buffer';

export const sha256 = (input: string): string => Buffer.from(nobleSha256(input)).toString('hex');
export const sha512 = (input: string): string => Buffer.from(nobleSha512(input)).toString('hex');
