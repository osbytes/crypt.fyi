export const sleep = (
  ms: number,
  { enabled = true }: { enabled?: boolean } = {},
): Promise<void> =>
  enabled
    ? new Promise((resolve) => setTimeout(resolve, ms))
    : Promise.resolve();
