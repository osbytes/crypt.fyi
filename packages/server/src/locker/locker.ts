export interface Locker {
  lock<T>(key: string, ttl: number, fn: (signal: AbortSignal) => Promise<T>): Promise<T>;
}

export class LockAcquisitionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LockAcquisitionError';
  }
}

export class LockLostError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LockLostError';
  }
}
