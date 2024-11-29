# PhemVault

A zero-knowledge, end-to-end encrypted secret sharing platform that enables secure transmission of sensitive information.

## Features

- 🔒 End-to-end encryption using AES-256-GCM
- 🤫 Zero-knowledge architecture - server never sees unencrypted data
- 🔥 Burn after reading option
- ⏰ Automatic expiration (Time-To-Live)
- 🔑 Optional password protection
- 🚫 No user accounts or tracking
- 🌓 Dark/Light theme support

## How It Works

1. Your secret is encrypted in your browser using AES-256-GCM
2. The encrypted data is stored temporarily on our servers
3. A unique URL containing the decryption key is generated
4. Share the URL with your recipient
5. When accessed, the secret is decrypted in the recipient's browser
6. Optional: Secret is automatically destroyed after being read

## Security Features

- Client-side encryption/decryption only
- Unique encryption key per secret
- Optional password protection (double encryption)
- No server-side logging of sensitive data
- Automatic data expiration
- TLS transport encryption
- CORS protection and rate limiting
- Strict Content Security Policy (CSP) to prevent XSS attacks and unauthorized resource loading

## API Usage

### Store a Secret

```typescript
POST /vault
{
  "c": string,    // encrypted content
  "h": string,    // sha256 hash of encryption key + optional password
  "b": boolean,   // burn after reading flag
  "ttl": number   // time-to-live in milliseconds
}
```

### Retrieve a Secret

```typescript
GET /vault/:vaultId?h=<key_hash>
```

### Delete a Secret

```typescript
DELETE /vault/:vaultId
{
  "dt": string    // delete token
}
```

## Technical Stack

- Frontend: React-based SPA
- Backend: Node.js with Fastify
- Storage: Redis
- Encryption: Web Crypto API
- Performance Monitoring: OpenTelemetry

## Development

1. Clone the repository
2. Install dependencies:
   ```bash
   yarn install
   ```
3. Set up environment variables (see `.env.example`)
4. Start the development server:
   ```bash
   yarn run dev
   ```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
