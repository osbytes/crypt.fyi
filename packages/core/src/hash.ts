import { sha256 as nobleSha256 } from '@noble/hashes/sha256';
import { Buffer } from './buffer';

export const sha256 = (input: string): string => Buffer.from(nobleSha256(input)).toString('hex');
