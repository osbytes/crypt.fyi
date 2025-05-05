import { Buffer } from './buffer';
import {
  CreateVaultRequest,
  CreateVaultResponse,
  DeleteVaultRequest,
  ReadVaultResponse,
} from './api';
import { generateRandomString } from './random';
import { sha512 } from './hash';
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
    const key = await generateRandomString(this.keyLength);

    const metadata: ProcessingMetadata = input.m ?? {
      compression: {
        algorithm: 'zlib:pako',
      },
      encryption: {
        algorithm: 'ml-kem-768-2',
      },
    };

    const processed = await this.processContent(input.c, metadata, key).then((r) =>
      !input.p ? r : this.processContent(r, metadata, input.p),
    );
    const hash = sha512(key + (input.p ?? ''));

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
    const h = sha512(key + (password ?? ''));
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
    const decrypted = password
      ? await this.recoverContent(data.c, password, data.m).then((d) =>
          this.recoverContent(d, key, data.m),
        )
      : await this.recoverContent(data.c, key, data.m);

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
