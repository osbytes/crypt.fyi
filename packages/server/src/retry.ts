import retry from 'retry';

export type RetryOpts = retry.OperationOptions;

export const retryable = <T>(action: () => Promise<T>, opts?: RetryOpts): Promise<T> => {
  return new Promise((resolve, reject) => {
    const op = retry.operation(opts);

    op.attempt(async () => {
      try {
        resolve(await action());
      } catch (err) {
        if (!(err instanceof Error)) {
          reject(err);
        } else {
          if (!op.retry(err)) reject(err);
        }
      }
    });
  });
};
