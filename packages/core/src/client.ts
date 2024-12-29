import {
  CreateVaultRequest,
  CreateVaultResponse,
  DeleteVaultRequest,
  ReadVaultResponse,
} from './api';
import { generateRandomString } from './encryption';
import { encrypt as defaultEncrypt, decrypt as defaultDecrypt } from './encryption';
import { sha256 } from './encryption';

export class Client {
  private readonly apiUrl: string;
  private readonly keyLength: number;
  private readonly encrypt: typeof defaultEncrypt;
  private readonly decrypt: typeof defaultDecrypt;

  constructor({
    apiUrl,
    keyLength,
    encrypt = defaultEncrypt,
    decrypt = defaultDecrypt,
  }: {
    apiUrl: string;
    keyLength: number;
    encrypt?: typeof defaultEncrypt;
    decrypt?: typeof defaultDecrypt;
  }) {
    this.apiUrl = apiUrl;
    this.keyLength = keyLength;
    this.encrypt = encrypt;
    this.decrypt = decrypt;
  }

  async create(
    input: Omit<CreateVaultRequest, 'h'> & { p?: string },
  ): Promise<CreateVaultResponse & { key: string; hash: string }> {
    const key = await generateRandomString(this.keyLength);
    let encrypted = await this.encrypt(input.c, key);
    if (input.p) {
      encrypted = await this.encrypt(encrypted, input.p);
    }
    const hash = sha256(key + (input.p ?? ''));

    const response = await fetch(`${this.apiUrl}/vault`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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
    const h = sha256(key + (password ?? ''));
    const res = await fetch(`${this.apiUrl}/vault/${id}?h=${h}`);
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

    return {
      value: decrypted,
      burned: data.b,
      cd: data.cd,
      ttl: data.ttl,
    };
  }

  async delete(id: string, dt: string) {
    const response = await fetch(`${this.apiUrl}/vault/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
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
