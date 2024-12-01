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

1. Encryption key is generated on the client
1. Password is optionally provided
1. Encryption key and password are used to encrypt the secret
1. Encryption key and password are **hashed** and stored along with the encrypted secret for verification on retrieval - the raw key and password are **never** stored or transmitted on/to the server
1. The unique URL containing the decryption key is generated on the client
1. Share the URL with your recipient and separately the password if specified
1. When accessed, only when the decryption key and password match via server-side verification of the hashes, the encrypted secret is shared and decrypted in the recipient's browser
1. Optionally, the secret is automatically destroyed after being read in an atomic read & delete operation guaranteeing only one person can access the secret
1. If retrieval doesn't happen within the TTL, the secret is automatically destroyed

## Security Features

- Client-side encryption/decryption only
- Unique encryption key per secret
- Optional password protection (layered encryption)
  - Password is not embedded in the URL and is ideally shared/transmitted separately from the URL
- No server-side logging of sensitive data
- Automatic data expiration
- TLS transport encryption
- CORS protection and rate limiting
- Strict Content Security Policy (CSP) to prevent XSS attacks and unauthorized resource loading
- Rate limits to mitigate brute-force attacks

[RFC](./SPECIFICATION.md)

## API Usage

[OpenAPI Specification](https://phemvaultserver-production.up.railway.app/docs)

## Technical Stack

- React SPA
- [shadcn/ui](https://ui.shadcn.com/docs)
- Node.js with [Fastify](https://fastify.dev/)
- [Redis](https://redis.io/)
- [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
- [OpenTelemetry](https://opentelemetry.io/)

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

Contributions are welcome! Please feel free to submit an [Issue](https://github.com/dillonstreator/phemvault/issues) or [Pull Request](https://github.com/dillonstreator/phemvault/pulls) on [GitHub](https://github.com/dillonstreator/phemvault).
