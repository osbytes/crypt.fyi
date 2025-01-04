export type Encrypt = (data: string, key: string) => Promise<string>;
export type Decrypt = (data: string, key: string) => Promise<string>;

export class DecryptError extends Error {
  error: unknown;
  constructor(error: unknown) {
    super('decrypt error');
    this.name = 'DecryptError';
    this.error = error;
  }
}

export class EncryptError extends Error {
  error: unknown;
  constructor(error: unknown) {
    super('encrypt error');
    this.name = 'EncryptError';
    this.error = error;
  }
}
