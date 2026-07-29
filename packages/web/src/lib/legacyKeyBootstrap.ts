import { stripLegacyKeyFromUrl } from './secretUrl';

export interface LegacyKeyCapture {
  legacyQueryKey: string | null;
  hadLegacyQueryKey: boolean;
}

interface PendingLegacyKeyCapture extends LegacyKeyCapture {
  pathname: string;
}

let pendingCapture: PendingLegacyKeyCapture | null = null;
let pendingClearTimer: ReturnType<typeof setTimeout> | null = null;

function isPotentialSecretPath(pathname: string): boolean {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length !== 1) return false;

  const segment = segments[0];
  return !['new', 'about', 'privacy'].includes(segment);
}

/**
 * Capture and scrub a deprecated query-string key before the router starts.
 *
 * The raw value remains only in this module closure until the view consumes it.
 * If a fragment key exists, the query value is discarded immediately because
 * fragments have priority.
 */
function captureLegacyQueryKey(): void {
  if (pendingCapture || typeof window === 'undefined') return;

  const params = new URLSearchParams(window.location.search);
  const hadLegacyQueryKey = params.has('key');
  if (!hadLegacyQueryKey) return;

  const isSecretPath = isPotentialSecretPath(window.location.pathname);
  const hasFragmentKey = window.location.hash.replace(/^#/, '').trim().length > 0;
  if (isSecretPath) {
    pendingCapture = {
      legacyQueryKey: hasFragmentKey ? null : params.get('key'),
      hadLegacyQueryKey: true,
      pathname: window.location.pathname,
    };
  }

  const cleanUrl = stripLegacyKeyFromUrl(
    window.location.pathname,
    window.location.search,
    window.location.hash,
  );
  window.history.replaceState(window.history.state, '', cleanUrl);
}

captureLegacyQueryKey();

function deferPendingCaptureDrop(captured: PendingLegacyKeyCapture): void {
  if (pendingClearTimer !== null) return;

  // React may replay an initial render before committing it. Keep the capture
  // available only through the current event-loop turn so both renders see the
  // same compatibility value, then drop the module's extra raw-key reference.
  pendingClearTimer = setTimeout(() => {
    if (pendingCapture === captured) pendingCapture = null;
    pendingClearTimer = null;
  }, 0);
}

/**
 * Returns the bootstrap capture for the current pathname.
 *
 * Replayed initial renders may read the same capture during this event-loop
 * turn. The module reference is dropped immediately afterward.
 */
export function consumeLegacyQueryKey(): LegacyKeyCapture {
  if (typeof window === 'undefined') {
    return {
      legacyQueryKey: null,
      hadLegacyQueryKey: false,
    };
  }

  const captured = pendingCapture;
  if (!captured || captured.pathname !== window.location.pathname) {
    pendingCapture = null;
    if (pendingClearTimer !== null) {
      clearTimeout(pendingClearTimer);
      pendingClearTimer = null;
    }
    return {
      legacyQueryKey: null,
      hadLegacyQueryKey: false,
    };
  }

  deferPendingCaptureDrop(captured);
  return {
    legacyQueryKey: captured.legacyQueryKey,
    hadLegacyQueryKey: captured.hadLegacyQueryKey,
  };
}
