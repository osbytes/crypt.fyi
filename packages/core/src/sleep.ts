export const sleep = (ms: number, { enabled = true }: { enabled?: boolean } = {}): Promise<void> =>
  enabled ? new Promise((resolve) => setTimeout(resolve, ms)) : Promise.resolve();

export type CancellableSleep = {
  promise: Promise<void>;
  cancel: () => void;
};

export const sleepWithCancel = (
  ms: number,
  { enabled = true }: { enabled?: boolean } = {},
): CancellableSleep => {
  if (!enabled) {
    return {
      promise: Promise.resolve(),
      cancel: () => {}, // No-op for disabled sleep
    };
  }

  let timeoutId: ReturnType<typeof setTimeout>;
  const promise = new Promise<void>((resolve) => {
    timeoutId = setTimeout(resolve, ms);
  });

  return {
    promise,
    cancel: () => {
      clearTimeout(timeoutId);
    },
  };
};
