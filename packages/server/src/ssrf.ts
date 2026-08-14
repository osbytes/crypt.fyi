import { lookup as dnsLookup } from 'node:dns/promises';
import { SsrfError, isPrivateIp, validateWebhookUrl } from '@crypt.fyi/core';

export type WebhookUrlGuardOptions = {
  requireHttps?: boolean;
};

/**
 * Validates a webhook target URL at vault-creation time:
 *   1. Enforces the URL scheme and rejects literal private/reserved hosts
 *      (synchronous, shared with the client via @crypt.fyi/core).
 *   2. Resolves the hostname and rejects if ANY resolved address is private,
 *      reserved, loopback, or link-local.
 *
 * Validation runs once, when the secret is created — not on every webhook
 * delivery. This keeps the read/burn hot path free of DNS work. The trade-off is
 * that a hostname which resolves to a public address at creation but is later
 * repointed at a private address (DNS rebinding) is not re-checked at delivery
 * time; block-listing at the network egress layer is the defense for that.
 *
 * Throws SsrfError when the target is disallowed.
 */
export const assertWebhookUrlAllowed = async (
  url: string,
  options: WebhookUrlGuardOptions = {},
): Promise<void> => {
  validateWebhookUrl(url, { requireHttps: options.requireHttps ?? false });

  const { hostname } = new URL(url);
  const stripped = hostname.replace(/^\[/, '').replace(/\]$/, '');

  // A literal-IP host was already fully checked by validateWebhookUrl.
  if (isPrivateIp(stripped)) {
    return;
  }

  let resolved: { address: string }[];
  try {
    resolved = await dnsLookup(stripped, { all: true, verbatim: true });
  } catch {
    throw new SsrfError('Webhook URL host could not be resolved');
  }

  if (resolved.length === 0) {
    throw new SsrfError('Webhook URL host could not be resolved');
  }

  for (const { address } of resolved) {
    if (isPrivateIp(address)) {
      throw new SsrfError('Webhook URL resolves to a private or reserved address');
    }
  }
};
