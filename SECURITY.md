# Security Policy

## Reporting a Vulnerability

We take the security of crypt.fyi seriously. If you believe you have found a security vulnerability, please report it to us through one of the following channels:

1. **GitHub Security Advisory** (Preferred Method)

   - Visit our [Security Advisory page](https://github.com/osbytes/crypt.fyi/security/advisories/new)
   - This provides a secure, private channel to discuss and fix vulnerabilities
   - Allows for coordinated disclosure
   - Enables direct collaboration with maintainers

2. **Email**
   If you prefer email communication, you can reach us at [hi+security@crypt.fyi](mailto:hi+security@crypt.fyi)

**Please do NOT report security vulnerabilities through public GitHub issues.**

You should receive a response within 48 hours. If for some reason you do not, please follow up to ensure we received your original message.

Please include the following information in your report:

- Type of issue (e.g. encryption bypass, authentication vulnerabilities, file access control issues, key management flaws, client-side security issues)
- Full paths of source file(s) related to the manifestation of the issue
- The location of the affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

## Best Practices

### Data Protection

- All sensitive data is encrypted on the client, in transit, and at rest
- No server-side logging of sensitive data
- Zero-Trust architecture

### Development Practices

- Dependencies are regularly updated and monitored for vulnerabilities
- Code changes undergo security review before deployment

## Acknowledgments

We would like to thank the following individuals who have contributed to the security of crypt.fyi through responsible disclosure:

_This section will be updated as contributions are received._
