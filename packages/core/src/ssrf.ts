// Shared SSRF-prevention helpers.
//
// This module is browser-safe (no node built-ins) so it can run in both the
// client bundle and the server. It provides:
//   - isPrivateIp: classify a literal IP as private/reserved/loopback/link-local
//   - validateWebhookUrl: synchronous URL validation (scheme + literal-IP hosts)
//
// IP range classification is delegated to `ipaddr.js` (a maintained, widely-used
// address library) rather than hand-rolled bit math. DNS-resolving, rebind-safe
// enforcement lives server-side (see the server package) because it requires
// node:dns; this module only covers what can be decided from the URL string.

import ipaddr from 'ipaddr.js';

export class SsrfError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SsrfError';
  }
}

// ipaddr.js range names that are NOT safe to connect to from the server.
// "unicast" (public IPv4) and "global"/"uniqueGlobal" style unicast are the only
// ranges we allow; everything else (loopback, private, link-local, reserved,
// multicast, broadcast, CGNAT, etc.) is rejected.
const ALLOWED_IPV4_RANGES = new Set(['unicast']);
const ALLOWED_IPV6_RANGES = new Set(['unicast']);

/** Returns true if the given literal IP string is private, reserved, loopback, or link-local. */
export const isPrivateIp = (ip: string): boolean => {
  if (!ipaddr.isValid(ip)) {
    // Not a literal IP — caller must resolve it before deciding.
    return false;
  }

  let addr = ipaddr.parse(ip);

  // Unwrap IPv4-mapped/compatible IPv6 addresses and classify the embedded v4,
  // so `::ffff:169.254.169.254` is treated exactly like `169.254.169.254`.
  if (addr.kind() === 'ipv6' && (addr as ipaddr.IPv6).isIPv4MappedAddress()) {
    addr = (addr as ipaddr.IPv6).toIPv4Address();
  }

  const range = addr.range();
  if (addr.kind() === 'ipv4') {
    return !ALLOWED_IPV4_RANGES.has(range);
  }
  return !ALLOWED_IPV6_RANGES.has(range);
};

const isIpLiteral = (host: string): boolean => {
  const stripped = host.replace(/^\[/, '').replace(/\]$/, '');
  return ipaddr.isValid(stripped);
};

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'ip6-localhost',
  'ip6-loopback',
  'metadata', // GCP short name
  'metadata.google.internal',
]);

export type ValidateWebhookUrlOptions = {
  /** Allowed URL schemes. Defaults to http and https. */
  allowedProtocols?: string[];
  /** When false, plain http is permitted (useful for local development). Defaults to true. */
  requireHttps?: boolean;
};

/**
 * Synchronously validates a webhook URL string: enforces the scheme and rejects
 * hosts that are literal private/reserved IPs or well-known internal hostnames.
 *
 * This does NOT resolve DNS — a hostname that resolves to a private IP passes
 * here and must be caught by the server's resolve-time guard. Throws SsrfError
 * on rejection.
 */
export const validateWebhookUrl = (url: string, options: ValidateWebhookUrlOptions = {}): void => {
  const { requireHttps = true } = options;
  const allowedProtocols =
    options.allowedProtocols ?? (requireHttps ? ['https:'] : ['http:', 'https:']);

  // Infer the URL type from `new URL(...)` rather than annotating `parsed: URL`.
  // During the DTS rollup build the explicit annotation can resolve to a
  // different global `URL` type (DOM vs node), which fails structural checks
  // (missing createObjectURL/revokeObjectURL/canParse). Inference avoids that.
  const parsed = (() => {
    try {
      return new URL(url);
    } catch {
      throw new SsrfError('Invalid webhook URL');
    }
  })();

  if (!allowedProtocols.includes(parsed.protocol)) {
    throw new SsrfError(
      `Webhook URL protocol "${parsed.protocol}" is not allowed (allowed: ${allowedProtocols.join(', ')})`,
    );
  }

  const host = parsed.hostname.toLowerCase();
  if (BLOCKED_HOSTNAMES.has(host) || host.endsWith('.localhost') || host.endsWith('.local')) {
    throw new SsrfError('Webhook URL host is not allowed');
  }

  const stripped = parsed.hostname.replace(/^\[/, '').replace(/\]$/, '');
  if (isIpLiteral(parsed.hostname) && isPrivateIp(stripped)) {
    throw new SsrfError('Webhook URL resolves to a private or reserved address');
  }
};

/** Returns true if the URL passes validateWebhookUrl, false otherwise. */
export const isValidWebhookUrl = (url: string, options?: ValidateWebhookUrlOptions): boolean => {
  try {
    validateWebhookUrl(url, options);
    return true;
  } catch {
    return false;
  }
};
