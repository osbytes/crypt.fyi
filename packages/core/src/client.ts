import { Buffer } from './buffer';
import {
  CreateVaultRequest,
  CreateVaultResponse,
  DeleteVaultRequest,
  ReadVaultResponse,
} from './api';
import { generateRandomString } from './random';
import { KEY_VERSION_2_PREFIX, deriveVerificationHash, parseKey } from './verification';
import { encryptionRegistry, compressionRegistry, validateMetadata } from './encryption/registry';
import { ProcessingMetadata } from './vault';
import { gcm } from './encryption';
import { inflate } from 'pako';

export class Client {
  private readonly apiUrl: string;
  private readonly keyLength: number;
  private readonly xClient: string | undefined;

  constructor({
    apiUrl,
    keyLength = 32,
    xClient,
  }: {
    apiUrl: string;
    keyLength?: number;
    xClient?: string;
  }) {
    this.apiUrl = apiUrl;
    this.keyLength = keyLength;
    this.xClient = xClient;
  }

  private getHeaders() {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.xClient) {
      headers['X-Client'] = this.xClient;
    }
    return headers;
  }

  private async processContent(
    content: string,
    metadata: ProcessingMetadata,
    key: string,
  ): Promise<string> {
    validateMetadata(metadata);
    let processed = content;

    if (metadata.compression?.algorithm) {
      const algorithm = compressionRegistry[metadata.compression.algorithm];
      const compressed = algorithm.compress(new TextEncoder().encode(processed));
      processed = Buffer.from(compressed).toString('base64');
    }

    if (metadata.encryption?.algorithm) {
      const algorithm = encryptionRegistry[metadata.encryption.algorithm];
      processed = await algorithm.encrypt(processed, key);
    }

    return processed;
  }

  // Metadata for the inner (URL key) layer: carries compression + the primary
  // encryption algorithm.
  private keyLayerMetadata(metadata: ProcessingMetadata): ProcessingMetadata {
    return {
      compression: metadata.compression,
      encryption: { algorithm: metadata.encryption.algorithm },
    };
  }

  // Metadata for the outer (user password) layer: encryption only, no
  // compression (compression happens once, on the inner layer).
  private passwordLayerMetadata(metadata: ProcessingMetadata): ProcessingMetadata {
    return {
      encryption: {
        algorithm: metadata.encryption.passwordAlgorithm ?? metadata.encryption.algorithm,
      },
    };
  }

  private async recoverContent(
    encoded: string,
    key: string,
    metadata?: ProcessingMetadata,
  ): Promise<string> {
    if (!metadata) {
      // Backward compatibility prior to introduction of metadata
      const decrypted = JSON.parse(await gcm.decrypt(encoded, key)) as any;
      if ('metadata' in decrypted) {
        let processedContent = Buffer.from(decrypted.data, 'base64');
        if (decrypted.metadata.compression?.algorithm === 'zlib:pako') {
          const decompressed = inflate(processedContent);
          processedContent = Buffer.from(decompressed);
        }
        return new TextDecoder().decode(processedContent);
      }
      return decrypted;
    }

    validateMetadata(metadata);

    let recovered = encoded;

    if (metadata.encryption?.algorithm) {
      const algorithm = encryptionRegistry[metadata.encryption.algorithm];
      recovered = await algorithm.decrypt(recovered, key);
    }

    if (metadata.compression?.algorithm) {
      const algorithm = compressionRegistry[metadata.compression.algorithm];
      const decompressed = algorithm.decompress(Buffer.from(recovered, 'base64'));
      recovered = new TextDecoder().decode(decompressed);
    }

    return recovered;
  }

  async create(
    input: Omit<CreateVaultRequest, 'h' | 'm'> & { p?: string; m?: ProcessingMetadata },
  ): Promise<CreateVaultResponse & { key: string; hash: string }> {
    const rawKey = await generateRandomString(this.keyLength);
    const hasPassword = input.p !== undefined && input.p !== '';

    // Fast KDF for the high-entropy URL key layer; memory-hard Argon2id only for
    // the user-password layer, and only when a password is actually set.
    const metadata: ProcessingMetadata = input.m ?? {
      compression: {
        algorithm: 'zlib:pako',
      },
      encryption: {
        algorithm: 'ml-kem-768-2',
        passwordAlgorithm: hasPassword ? 'ml-kem-768-argon2' : undefined,
      },
    };

    let processed: string;
    if (!hasPassword) {
      processed = await this.processContent(input.c, metadata, rawKey);
    } else if (metadata.encryption.passwordAlgorithm) {
      // Asymmetric: compress + key-encrypt inner, then password-encrypt outer.
      const inner = await this.processContent(input.c, this.keyLayerMetadata(metadata), rawKey);
      processed = await this.processContent(
        inner,
        this.passwordLayerMetadata(metadata),
        input.p as string,
      );
    } else {
      // Legacy symmetric pipeline (custom metadata without passwordAlgorithm).
      const inner = await this.processContent(input.c, metadata, rawKey);
      processed = await this.processContent(inner, metadata, input.p as string);
    }

    // Only password-protected secrets need the Argon2id (v2) verification hash;
    // a bare high-entropy key is not brute-forceable, so it keeps the fast hash.
    // The version prefix on the shared key tells the reader which scheme to use.
    const key = hasPassword ? `${KEY_VERSION_2_PREFIX}${rawKey}` : rawKey;
    const hash = hasPassword
      ? await deriveVerificationHash('v2', rawKey, input.p)
      : await deriveVerificationHash('legacy', rawKey);

    const response = await fetch(`${this.apiUrl}/vault`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        c: processed,
        h: hash,
        m: metadata,
        b: input.b,
        ttl: input.ttl,
        ips: input.ips,
        rc: input.rc,
        fc: input.fc,
        wh: input.wh
          ? {
              u: input.wh.u,
              n: input.wh.n,
              r: input.wh.r,
              fpk: input.wh.fpk,
              fip: input.wh.fip,
              b: input.wh.b,
            }
          : undefined,
      } satisfies CreateVaultRequest),
    });
    if (!response.ok) {
      throw new ErrorUnexpectedStatus(response.status);
    }

    const data = await (response.json() as Promise<CreateVaultResponse>);
    return {
      ...data,
      key,
      hash,
    };
  }

  async read(id: string, key: string, password?: string) {
    const { scheme, rawKey } = parseKey(key);
    const h = await deriveVerificationHash(scheme, rawKey, password);
    const res = await fetch(`${this.apiUrl}/vault/${id}?h=${h}`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      if (res.status === 400) {
        throw new ErrorInvalidKeyAndOrPassword();
      } else if (res.status === 404) {
        throw new ErrorNotFound();
      }
      throw new ErrorUnexpectedStatus(res.status);
    }

    const data = await (res.json() as Promise<ReadVaultResponse>);
    let decrypted: string;
    if (!password) {
      decrypted = await this.recoverContent(data.c, rawKey, data.m);
    } else if (data.m?.encryption?.passwordAlgorithm) {
      // Asymmetric: password-decrypt outer, then key-decrypt + decompress inner.
      const tmp = await this.recoverContent(data.c, password, this.passwordLayerMetadata(data.m));
      decrypted = await this.recoverContent(tmp, rawKey, this.keyLayerMetadata(data.m));
    } else {
      // Legacy symmetric pipeline.
      const tmp = await this.recoverContent(data.c, password, data.m);
      decrypted = await this.recoverContent(tmp, rawKey, data.m);
    }

    return {
      c: decrypted,
      burned: data.b,
      cd: data.cd,
      ttl: data.ttl,
    };
  }

  async delete(id: string, dt: string) {
    const response = await fetch(`${this.apiUrl}/vault/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
      body: JSON.stringify({ dt } satisfies DeleteVaultRequest),
    });
    if (!response.ok) {
      if (response.status === 404) {
        throw new ErrorNotFound();
      }
      throw new ErrorUnexpectedStatus(response.status);
    }
  }

  async exists(id: string): Promise<boolean> {
    const response = await fetch(`${this.apiUrl}/vault/${id}`, {
      method: 'HEAD',
      headers: this.getHeaders(),
    });
    if (!response.ok) {
      if (response.status === 404) {
        return false;
      }
      throw new ErrorUnexpectedStatus(response.status);
    }

    return true;
  }
}

export class ErrorNotFound extends Error {
  constructor() {
    super('secret not found');
  }
}

export class ErrorUnexpectedStatus extends Error {
  constructor(status: number) {
    super(`unexpected status code ${status}`);
  }
}

export class ErrorInvalidKeyAndOrPassword extends Error {
  constructor() {
    super('invalid key and/or password');
  }
}
