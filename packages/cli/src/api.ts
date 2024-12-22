import { Config } from './config';
import { CreateVaultRequest, CreateVaultResponse } from '@crypt.fyi/core';

export class ApiClient {
  constructor(private config: Config) {}

  async createVault(request: CreateVaultRequest): Promise<CreateVaultResponse> {
    const response = await fetch(`${this.config.apiUrl}/vault`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Failed to create vault: ${response.statusText}`);
    }

    return response.json() as Promise<CreateVaultResponse>;
  }
}
