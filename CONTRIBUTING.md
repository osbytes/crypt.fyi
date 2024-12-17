# Contributing to crypt.fyi

Thank you for your interest in contributing to crypt.fyi! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and constructive environment for all contributors.

## Getting Started

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/crypt.fyi.git
   ```
3. Create a new branch for your feature/fix:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Setup

1. Install dependencies:

   ```bash
   yarn install
   ```

2. Copy `.env.example` to `.env` and configure environment variables

3. Ensure Redis is running locally for server development

4. Start the development server:
   ```bash
   yarn run dev
   ```

## Pull Request Process

1. Ensure your code follows the project's style guide (uses Prettier)
2. Update documentation if you're changing functionality
3. Add tests for new features
4. Ensure all tests pass
5. Update the README.md if necessary
6. Create a Pull Request with a clear title and description

## Security Considerations

Given the security-critical nature of this application, please ensure:

1. No sensitive data is logged or exposed in error messages
2. All encryption/decryption operations remain client-side only
3. No weakening of the Content Security Policy (CSP)
4. Dependencies are kept up to date and security patches are applied
5. No accidental exposure of secrets or credentials in code or comments

## Coding Standards

- Use TypeScript for all new code
- Follow existing code formatting (Prettier configuration)
- Maintain strict typing - avoid `any` types
- Write self-documenting code with clear variable/function names
- Add JSDoc comments for public APIs
- Keep functions small and focused
- Use meaningful commit messages

## Testing

- Write unit tests for new functionality
- Ensure all tests pass before submitting PR
- Include both positive and negative test cases
- Test edge cases thoroughly, especially for security-critical features

## Documentation

When adding or modifying features:

1. Update relevant README files
2. Add JSDoc comments for new functions/components
3. Update the OpenAPI specification if modifying the API
4. Document security implications of changes
5. Update the SPECIFICATION.md for architectural changes

## Reporting Issues

When reporting issues, please include:

1. Description of the issue
2. Steps to reproduce
3. Expected behavior
4. Actual behavior
5. Environment details (OS, browser version, etc.)
6. Screenshots if applicable

For security vulnerabilities, please do NOT create a public issue. Instead, email security@crypt.fyi directly.

## Review Process

All submissions require review. We strive to:

1. Review PRs within 48 hours
2. Provide clear feedback
3. Help contributors meet project standards
4. Maintain security and quality

## License

By contributing to crypt.fyi, you agree that your contributions will be licensed under the same license as the project.

## Questions?

If you have questions about contributing, feel free to:

1. Open a GitHub Discussion
2. Join our community chat
3. Email contributors@crypt.fyi

Thank you for helping make crypt.fyi better!
