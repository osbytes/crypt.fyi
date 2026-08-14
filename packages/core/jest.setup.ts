import { useFastKdfForTests } from './src/kdf';

// Production Argon2id / PBKDF2 params make pure-JS unit tests take minutes;
// keep algorithm coverage, drop work factors for this suite only.
useFastKdfForTests();
