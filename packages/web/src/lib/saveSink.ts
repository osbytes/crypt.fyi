/**
 * Somewhere to write a decrypted payload that is not memory.
 *
 * A multi-gigabyte download cannot be assembled into a Blob, so we need a sink
 * that streams to disk. Three, in order of preference:
 *
 *   1. File System Access API — a real file handle. Chrome, Edge, Opera.
 *   2. Service worker  — manufactures a native browser download from a stream.
 *      Everywhere else, including Firefox, Safari, and mobile. See
 *      public/_download/sw.js, which is scoped to /_download/ and can intercept
 *      nothing else.
 *   3. Blob — buffers everything. Only for payloads small enough to hold.
 *
 * Everything is served from our own origin; no third-party script or iframe is
 * involved at any point.
 *
 * ---------------------------------------------------------------------------
 * Call this from the click handler, before starting the transfer.
 * ---------------------------------------------------------------------------
 * `showSaveFilePicker` requires user activation, and activation does not
 * survive an intervening `await`. Create the sink first, then fetch.
 */

const SW_URL = '/_download/sw.js';
const SW_MESSAGE_TYPE = 'crypt.fyi/download';
/** Above this, a Blob is not a responsible fallback. */
export const BLOB_SINK_LIMIT = 200 * 1024 * 1024;

export type SaveSinkKind = 'file-system-access' | 'service-worker' | 'blob';

export type SaveSink = {
  kind: SaveSinkKind;
  writable: WritableStream<Uint8Array>;
  /** Resolves once the bytes have landed. */
  done: Promise<void>;
  /** Abandons the download and releases anything held for it. */
  abort(reason?: unknown): Promise<void>;
};

type SaveSinkOptions = {
  filename: string;
  /** Plaintext byte length; lets the browser show real progress. */
  size: number;
  mimeType?: string;
};

type FileSystemWritable = WritableStream<Uint8Array> & { close(): Promise<void> };
type FileSystemFileHandle = { createWritable(): Promise<FileSystemWritable> };
type SaveFilePicker = (options: {
  suggestedName?: string;
  types?: Array<{ description?: string; accept: Record<string, string[]> }>;
}) => Promise<FileSystemFileHandle>;

const getSaveFilePicker = (): SaveFilePicker | undefined =>
  (globalThis as { showSaveFilePicker?: SaveFilePicker }).showSaveFilePicker;

/**
 * Transferring a ReadableStream to the worker needs transferable streams
 * (Chrome 87+, Firefox 103+, Safari 16.4+). Probe rather than sniff versions.
 */
const supportsTransferableStreams = (): boolean => {
  try {
    const stream = new ReadableStream();
    const channel = new MessageChannel();
    channel.port1.postMessage(stream, [stream as unknown as Transferable]);
    channel.port1.close();
    channel.port2.close();
    return true;
  } catch {
    return false;
  }
};

export const supportsFileSystemAccess = (): boolean => typeof getSaveFilePicker() === 'function';

export const supportsServiceWorkerSink = (): boolean =>
  typeof navigator !== 'undefined' &&
  'serviceWorker' in navigator &&
  window.isSecureContext &&
  supportsTransferableStreams();

/** Opaque, bounded token — the shape the worker will accept. */
const newDownloadId = (): string => {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

// The worker is registered on demand and unregistered once the last download
// finishes, so it is not resident while the app is merely open.
let activeDownloads = 0;

const releaseWorker = async () => {
  activeDownloads = Math.max(0, activeDownloads - 1);
  if (activeDownloads > 0) {
    return;
  }
  try {
    const registration = await navigator.serviceWorker.getRegistration(SW_URL);
    await registration?.unregister();
  } catch {
    // Unregistering is hygiene, not correctness.
  }
};

const armWorker = async (
  id: string,
  stream: ReadableStream<Uint8Array>,
  options: SaveSinkOptions,
): Promise<void> => {
  const registration = await navigator.serviceWorker.register(SW_URL);
  // register() resolves before the worker is necessarily active.
  await navigator.serviceWorker.ready.catch(() => undefined);

  const worker = registration.active ?? registration.waiting ?? registration.installing;
  if (!worker) {
    throw new Error('download worker failed to start');
  }
  if (worker.state !== 'activated') {
    await new Promise<void>((resolve) => {
      const onChange = () => {
        if (worker.state === 'activated') {
          worker.removeEventListener('statechange', onChange);
          resolve();
        }
      };
      worker.addEventListener('statechange', onChange);
      onChange();
    });
  }

  // Wait for the worker to confirm it is holding the stream before navigating.
  // Without the ack there is a window in which a terminated worker would drop
  // the entry and the iframe would 404.
  const channel = new MessageChannel();
  const acked = new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('download worker did not respond')), 10_000);
    channel.port1.onmessage = (event: MessageEvent<{ ok: boolean; reason?: string }>) => {
      clearTimeout(timeout);
      channel.port1.close();
      if (event.data?.ok) {
        resolve();
      } else {
        reject(new Error(event.data?.reason ?? 'worker refused'));
      }
    };
  });

  worker.postMessage(
    { type: SW_MESSAGE_TYPE, id, filename: options.filename, size: options.size, stream },
    [stream as unknown as Transferable, channel.port2],
  );

  await acked;
};

/** Triggers the download without navigating the page away. */
const openDownloadFrame = (id: string): (() => void) => {
  const frame = document.createElement('iframe');
  frame.hidden = true;
  frame.src = `/_download/${id}`;
  document.body.appendChild(frame);
  return () => frame.remove();
};

export const createSaveSink = async (options: SaveSinkOptions): Promise<SaveSink> => {
  const picker = getSaveFilePicker();
  if (picker) {
    const handle = await picker({ suggestedName: options.filename });
    const writable = await handle.createWritable();
    return {
      kind: 'file-system-access',
      writable,
      done: Promise.resolve(),
      abort: async (reason) => {
        await writable.abort?.(reason);
      },
    };
  }

  if (supportsServiceWorkerSink()) {
    const id = newDownloadId();
    const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>();

    activeDownloads += 1;
    try {
      await armWorker(id, readable, options);
    } catch (error) {
      await releaseWorker();
      throw error;
    }

    const closeFrame = openDownloadFrame(id);
    return {
      kind: 'service-worker',
      writable,
      done: Promise.resolve().then(async () => {
        // The frame has served its purpose once the browser owns the download.
        closeFrame();
        await releaseWorker();
      }),
      abort: async (reason) => {
        closeFrame();
        await writable.abort?.(reason).catch(() => undefined);
        await releaseWorker();
      },
    };
  }

  if (options.size > BLOB_SINK_LIMIT) {
    throw new Error(
      'This browser cannot save a file this large. Try Chrome, Edge, or a browser with streaming download support.',
    );
  }

  const chunks: Uint8Array[] = [];
  let settled: () => void = () => {};
  const done = new Promise<void>((resolve) => {
    settled = resolve;
  });

  const writable = new WritableStream<Uint8Array>({
    write(chunk) {
      chunks.push(chunk);
    },
    close() {
      const blob = new Blob(chunks as BlobPart[], {
        type: options.mimeType || 'application/octet-stream',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = options.filename;
      link.click();
      // Revoke once the browser has had a chance to start the download.
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
      settled();
    },
  });

  return {
    kind: 'blob',
    writable,
    done,
    abort: async (reason) => {
      await writable.abort?.(reason).catch(() => undefined);
    },
  };
};
