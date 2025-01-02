# [crypt.fyi](https://crypt.fyi)

A zero-knowledge, end-to-end encrypted secret sharing platform that enables secure transmission of sensitive information.

[![CI](https://github.com/osbytes/crypt.fyi/actions/workflows/ci.yml/badge.svg)](https://github.com/osbytes/crypt.fyi/actions/workflows/ci.yml)
[![Security Headers](https://img.shields.io/badge/Security%20Headers-A-brightgreen)](https://securityheaders.com/?q=https://www.crypt.fyi&followRedirects=on)
[![Mozilla HTTP Observatory Grade](https://img.shields.io/mozilla-observatory/grade-score/crypt.fyi)](https://developer.mozilla.org/en-US/observatory/analyze?host=crypt.fyi)
[![CII Best Practices](https://bestpractices.coreinfrastructure.org/projects/9850/badge)](https://bestpractices.coreinfrastructure.org/projects/9850)
[![i18n ✓](https://img.shields.io/badge/i18n-✓-blue?logo=translate)](https://github.com/osbytes/crypt.fyi/tree/main/packages/core/src/i18n/locales)

## Features

- 🔐 End-to-end encryption using AES-256-GCM
- 🛡️ Strict Content Security Policy (CSP) to prevent XSS attacks and unauthorized resource loading
- 🛡️ Strict rate limits to mitigate brute-force attacks
- 🤫 Zero-knowledge architecture - server never sees unencrypted data or decryption keys
- 🔥 Burn after reading w/ provisions to prevent erroneous burns from bots or url introspection
- ⏰ Automatic expiration (Time-To-Live)
- 🗝️ Password protection
- 📁 File sharing support w/ drag and drop
- 🪝 Webhook notifications for read success, read failure, and burn events
- 🌐 IP/CIDR allow-listing
- 🔢 Read count limits
- 📱 QR code generation
- ⌨️ [CLI](https://www.npmjs.com/package/@crypt.fyi/cli) for interacting with the API
- 🧩 [Chrome Extension](https://chromewebstore.google.com/detail/cryptfyi/hkmbmkjfjfdbpohlllleaacjkacfhald)
- 🐳 Docker images for the api server and web client
- 🌐 Localization with a handful of supported languages (more to come - help wanted!)

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

[RFC](./SPECIFICATION.md)

## API Usage

[OpenAPI Specification](https://api.crypt.fyi/docs)

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

## Known Issues & Development Considerations

### Content Security Policy

- The toast notification library (sonner) requires specific style-src hashes in the CSP configuration
- These hashes are defined in `nginx/nginx.conf`
- Updates to sonner may require updating these hashes
- Reference: [sonner#449](https://github.com/emilkowalski/sonner/issues/449)

### Development Environment

- Ensure Redis is running locally when developing the server
- The web client expects the API to be available at `http://localhost:4321` by default
- CSP headers in development may differ from production configuration

### Security Considerations

- Always test encryption/decryption flows thoroughly when making changes
- Ensure no sensitive data is logged or exposed in error messages
- Maintain strict CSP headers to prevent XSS vulnerabilities
- Keep dependencies updated for security patches

## Contributing

Contributions are welcome! Please feel free to submit an [Issue](https://github.com/osbytes/crypt.fyi/issues) or [Pull Request](https://github.com/osbytes/crypt.fyi/pulls) on [GitHub](https://github.com/osbytes/crypt.fyi).
