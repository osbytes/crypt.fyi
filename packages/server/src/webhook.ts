import { Logger } from './logging';

export type WebhookEvent = 'READ' | 'BURN' | 'FAILURE_KEY_PASSWORD' | 'FAILURE_IP_ADDRESS';

export type Message = {
  url: string;
  event: WebhookEvent;
  id: string;
  dt: string;
  ts: number;
  name?: string;
};

export interface WebhookSender {
  send(message: Message): Promise<void>;
}

const DEFAULT_TIMEOUT_MS = 3000;
export const createHTTPJSONWebhookSender = (
  logger: Logger,
  fetchFn: typeof fetch = fetch,
): WebhookSender => {
  return {
    send: async (message) => {
      const ac = new AbortController();
      setTimeout(() => ac.abort(), DEFAULT_TIMEOUT_MS);
      try {
        const response = await fetchFn(message.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(message),
          signal: ac.signal,
        });
        if (!response.ok) {
          logger.error(
            {
              event: message.event,
              id: message.id,
              status: response.status,
              statusText: response.statusText,
            },
            'Failed to send webhook',
          );
        }
      } catch (error) {
        logger.error(
          {
            event: message.event,
            id: message.id,
            error,
          },
          'Failed to send webhook',
        );
      }
    },
  };
};

export const createNopWebhookSender = (): WebhookSender => {
  return {
    send: async () => {},
  };
};
