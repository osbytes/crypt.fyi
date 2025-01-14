import { sleep } from '@crypt.fyi/core';

export const createFetchRetryClient = ({
  maxAttempts,
  requestTimeoutMs = 5_000,
  backoffDelayMs = 5_000,
  backoffFactor = 2,
  backoffMaxDelayMs = 60_000,
  fetchFn = fetch,
}: {
  maxAttempts: number;
  requestTimeoutMs?: number;
  backoffDelayMs?: number;
  backoffFactor?: number;
  backoffMaxDelayMs?: number;
  fetchFn?: typeof fetch;
}): typeof fetch => {
  return async (url, options) => {
    let attempts = 0;
    let errors: unknown[] = [];

    do {
      const signals = [options?.signal];
      let timeoutId: ReturnType<typeof setTimeout> | undefined;
      if (requestTimeoutMs > 0) {
        // We intentionally don't use AbortSignal.timeout because we want to control the abort reason without our sentinel TimeoutError
        // Maybe monkey patch AbortSignal.timeout to allow an optional sentinel error or create a helper function for this pattern
        const ab = new AbortController();
        timeoutId = setTimeout(() => ab.abort(new TimeoutError()), requestTimeoutMs);
        signals.push(ab.signal);
      }
      const signal = AbortSignal.any(signals.filter((s) => !!s));

      try {
        const response = await fetchFn(url, { ...options, signal });
        if (!response.ok) {
          throw new HTTPError(response.status, response.statusText);
        }

        return response;
      } catch (error) {
        errors.push(error);

        if (!isRetryableFetchError(error)) {
          throw new FetchRetryError(errors, 'Non-retryable error occurred');
        }
      } finally {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      }
      const backoffMs = calculateBackoff(attempts, {
        delayMs: backoffDelayMs,
        factor: backoffFactor,
        maxDelayMs: backoffMaxDelayMs,
      });

      await Promise.race([
        sleep(backoffMs),
        new Promise((resolve) => signal.addEventListener('abort', resolve)),
      ]);
    } while (++attempts < maxAttempts);

    throw new FetchRetryError(errors, 'Failed to fetch after max retries');
  };
};

export const isRetryableFetchError = (error: unknown): boolean => {
  if (error instanceof TypeError) {
    // Network errors are generally retryable
    return true;
  }
  if (error instanceof TimeoutError) {
    // Timeout errors are retryable
    return true;
  }

  return error instanceof HTTPError && isRetryableStatusCode(error.status);
};

const isRetryableStatusCode = (status: number): boolean => {
  // Server errors are generally retryable
  if (status >= 500 && status <= 599) return true;
  // Rate limiting is retryable
  if (status === 429) return true;
  // Specific service unavailable codes
  return [408, 423, 425].includes(status);
};

const calculateBackoff = (
  attempt: number,
  config: { delayMs: number; factor: number; maxDelayMs: number },
): number => {
  const backoffMs = config.delayMs * Math.pow(config.factor, attempt - 1);
  return Math.min(backoffMs, config.maxDelayMs);
};

class HTTPError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(`${status} ${message}`);
    this.status = status;
    this.name = 'HTTPError';
  }
}

// We use our own TimeoutError class to avoid conflicts with the DOMException TimeoutError
// which may come from the caller who would like to cancel the request without any further retries
export class TimeoutError extends Error {
  constructor() {
    super();
    this.name = 'TimeoutError';
  }
}

export class FetchRetryError extends Error {
  errors: unknown[];
  constructor(errors: unknown[], message: string) {
    super(message);
    this.errors = errors;
    this.name = 'FetchRetryError';
  }
  toString() {
    return this.errors.map((error) => (error instanceof Error ? error.message : error)).join('\n');
  }
}
