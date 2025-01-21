import { sleepWithCancel } from './sleep';

/**
 * Creates a fetch client with retry capabilities and configurable timeout behavior.
 *
 * @remarks
 * This client handles two distinct types of timeouts/cancellations:
 * 1. Internal timeout: Controlled by `requestTimeoutMs`. When triggered, the request will be retried
 *    if within `maxAttempts`. Uses a custom `TimeoutError` to distinguish from other abort events.
 * 2. External cancellation: Via caller-provided AbortSignal in fetch options. When triggered,
 *    immediately stops execution without retry attempts.
 *
 * The client uses exponential backoff between retry attempts, with configurable delay parameters.
 *
 * @param options - Configuration options for the retry client
 * @param options.maxAttempts - Maximum number of attempts before giving up
 * @param options.requestTimeoutMs - Timeout for each individual request attempt (default: 5000ms)
 * @param options.fetchFn - Optional custom fetch implementation (default: global fetch)
 * @param options.shouldRetry - Optional custom function to determine if an error is retryable (default: isRetryableFetchError)
 * @param options.calculateBackoff - Optional custom function to calculate the backoff delay between retries (default: defaultCalculateBackoff)
 *
 * @returns A fetch-compatible function that implements the retry logic
 *
 * @throws {FetchRetryError} When all retry attempts fail or a non-retryable error occurs
 *
 * @example
 * ```ts
 * const client = createFetchRetryClient({
 *   maxAttempts: 3,
 *   requestTimeoutMs: 2000
 * });
 *
 * // With caller cancellation
 * const controller = new AbortController();
 * const response = await client('https://api.example.com', {
 *   signal: controller.signal
 * });
 * ```
 */
export const createFetchRetryClient = ({
  maxAttempts,
  requestTimeoutMs = 5_000,
  fetchFn = fetch,
  shouldRetry = isRetryableFetchError,
  calculateBackoff = defaultCalculateBackoff,
}: {
  maxAttempts: number;
  requestTimeoutMs?: number;
  shouldRetry?: (error: unknown) => boolean;
  calculateBackoff?: (attempt: number) => number;
  fetchFn?: typeof fetch;
}): typeof fetch => {
  return async (url, options) => {
    let attempts = 0;
    const errors: unknown[] = [];

    do {
      const signals = [options?.signal];
      let timeoutId: ReturnType<typeof setTimeout> | undefined;
      if (requestTimeoutMs > 0) {
        // We intentionally don't use AbortSignal.timeout because we want to control the abort reason with our own sentinel `TimeoutError`
        // This allows our internal timeout to be retryable by default and a cancellation from the caller to be respected and not trigger a retry
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

        if (!shouldRetry(error)) {
          throw new FetchRetryError(errors, 'Non-retryable error occurred');
        }
      } finally {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      }
      const backoffMs = calculateBackoff(attempts);

      const sleeper = sleepWithCancel(backoffMs);
      const eventListenerAC = new AbortController();
      await Promise.race([
        sleeper.promise,
        new Promise((resolve) =>
          signal.addEventListener('abort', resolve, { signal: eventListenerAC.signal, once: true }),
        ),
      ]);
      sleeper.cancel();
      eventListenerAC.abort();
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

const defaultCalculateBackoff = (attempt: number): number => {
  const backoffMs = 5_000 * Math.pow(2, attempt - 1);
  return Math.min(backoffMs, 60_000);
};

export class HTTPError extends Error {
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
