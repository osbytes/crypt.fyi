import { inflate, deflate } from 'pako';
import { Buffer } from './buffer';
import {
  CreateVaultRequest,
  CreateVaultResponse,
  DeleteVaultRequest,
  ReadVaultResponse,
} from './api';
import { generateRandomString } from './random';
import { Decrypt, Encrypt, gcm } from './encryption';
import { sha256, sha512 } from './hash';

interface ContentMetadata {
  compression?: {
    algorithm: 'zlib:pako';
  };
  encryption: {
    algorithm: 'aes-256-gcm';
  };
}

interface EncodedContent {
  metadata: ContentMetadata;
  data: string;
}

export class Client {
  private readonly apiUrl: string;
  private readonly keyLength: number;
  private readonly encrypt: Encrypt;
  private readonly decrypt: Decrypt;
  private readonly xClient: string | undefined;

  constructor({
    apiUrl,
    keyLength = 32,
    encrypt = gcm.encrypt,
    decrypt = gcm.decrypt,
    xClient = undefined,
  }: {
    apiUrl: string;
    keyLength?: number;
    encrypt?: Encrypt;
    decrypt?: Decrypt;
    xClient?: string;
  }) {
    this.apiUrl = apiUrl;
    this.keyLength = keyLength;
    this.encrypt = encrypt;
    this.decrypt = decrypt;
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

  private compressContent(content: string): string {
    const compressed = deflate(new TextEncoder().encode(content));
    const result: EncodedContent = {
      metadata: {
        compression: {
          algorithm: 'zlib:pako',
        },
        encryption: {
          algorithm: 'aes-256-gcm',
        },
      },
      data: Buffer.from(compressed).toString('base64'),
    };
    return JSON.stringify(result);
  }

  private decompressContent(content: string): string {
    try {
      const parsed = JSON.parse(content) as EncodedContent;

      if (parsed.metadata) {
        let processedContent = Buffer.from(parsed.data, 'base64');

        if (parsed.metadata.compression?.algorithm === 'zlib:pako') {
          const decompressed = inflate(processedContent);
          processedContent = Buffer.from(decompressed);
        }
        // other future compression versions

        return new TextDecoder().decode(processedContent);
      }
    } catch {
      // If parsing fails, assume unencoded content
    }
    return content;
  }

  async create(
    input: Omit<CreateVaultRequest, 'h'> & { p?: string },
  ): Promise<CreateVaultResponse & { key: string; hash: string }> {
    const key = await generateRandomString(this.keyLength);

    const compressed = this.compressContent(input.c);

    let encrypted = await this.encrypt(compressed, key);
    if (input.p) {
      encrypted = await this.encrypt(encrypted, input.p);
    }
    const hash = sha512(key + (input.p ?? ''));

    const response = await fetch(`${this.apiUrl}/vault`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        c: encrypted,
        h: hash,
        b: input.b,
        ttl: input.ttl,
        ips: input.ips,
        rc: input.rc,
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
      ? await this.decrypt(data.c, password).then((d) => this.decrypt(d, key))
      : await this.decrypt(data.c, key);

    const decompressed = this.decompressContent(decrypted);

    return {
      c: decompressed,
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
