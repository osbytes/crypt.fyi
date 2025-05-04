# @crypt.fyi/core

<a href="https://crypt.fyi" target="_blank">
  <img src="https://crypt.fyi/logo-dark.svg" style="width: 100px;" alt="logo" />
</a>

Core library for interacting with the [crypt.fyi](https://crypt.fyi) API. This package provides a secure client implementation for creating, reading, and managing encrypted secrets.

## Features

- 🔒 ML-KEM post-quantum encryption
- 🗜️ Content compression using zlib
- 🔑 Password protection support
- ⏰ Time-to-live (TTL) functionality
- 🌐 Webhook integration
- 🔥 Burn after reading capability

## Installation

```bash
npm install @crypt.fyi/core
```

## Usage

```typescript
import { Client } from '@crypt.fyi/core';

// Initialize the client
const client = new Client({
  apiUrl: 'https://api.crypt.fyi',
  // Optional: custom key length (default: 32)
  keyLength: 32,
});

// Create an encrypted vault
const { id, key } = await client.create({
  c: 'my secret content',    // Content to encrypt
  ttl: 3600,                 // Time-to-live in seconds
  b: true,                   // Burn after reading
  p: 'optional-password',    // Optional password protection
});

// Read from an encrypted vault
const { c, burned, cd, ttl } = await client.read(id, key, 'optional-password');

// Check if a vault exists
const exists = await client.exists(id);

// Delete a vault
await client.delete(id, 'deletion-token');
```
