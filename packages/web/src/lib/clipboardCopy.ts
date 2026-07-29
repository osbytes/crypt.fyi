import copy from 'copy-to-clipboard';

interface ClipboardCopyOptions {
  /**
   * Permit the legacy, user-visible fallback when modern clipboard access is
   * unavailable. Disable this for automatic copy attempts so secret material
   * is never placed in an unexpected prompt.
   */
  userInitiatedFallback?: boolean;
}

export const clipboardCopy = async (
  text: string,
  { userInitiatedFallback = true }: ClipboardCopyOptions = {},
) => {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      if (!userInitiatedFallback) return false;
    }
  } else if (!userInitiatedFallback) {
    return false;
  }

  return copy(text);
};
