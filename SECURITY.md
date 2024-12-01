# Security Policy

## Reporting a Vulnerability

We take the security of PhemVault seriously. If you believe you have found a security vulnerability, please report it to us as described below.

**Please do NOT report security vulnerabilities through public GitHub issues.**

Instead, please report them via email to [hi+security@phemvault.com](mailto:hi+security@phemvault.com). You should receive a response within 48 hours. If for some reason you do not, please follow up via email to ensure we received your original message.

Please include the following information in your report:

- Type of issue (e.g. encryption bypass, authentication vulnerabilities, file access control issues, key management flaws, client-side security issues)
- Full paths of source file(s) related to the manifestation of the issue
- The location of the affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| latest  | :white_check_mark: |

## Best Practices

### Data Protection
- All sensitive data is encrypted on the client, in transit, and at rest
- No server-side logging of sensitive data
- Zero-Trust architecture

### Development Practices
- Dependencies are regularly updated and monitored for vulnerabilities
- Code changes undergo security review before deployment

## Acknowledgments

We would like to thank the following individuals who have contributed to the security of PhemVault through responsible disclosure:

*This section will be updated as contributions are received.*
