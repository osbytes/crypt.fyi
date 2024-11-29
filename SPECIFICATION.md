# PhemVault System Specification (RFC)

## 1. Introduction

### 1.1 Purpose
PhemVault is a zero-knowledge, end-to-end encrypted secret sharing platform that enables users to securely share sensitive information using AES-256 encryption. The system is designed with a "zero-knowledge" architecture, meaning the server never has access to unencrypted data or encryption keys.

### 1.2 Scope
This document outlines the system architecture, security measures, and interaction patterns between client and server components of the PhemVault system.

## 2. System Architecture

### 2.1 High-Level Overview
PhemVault follows a client-server architecture with the following main components:
- Web Client (Browser-based interface)
- API Server (Redis-backed storage)
- Redis (Encrypted data store)

### 2.2 Component Interaction Flow
```
[Web Client] <--> [API Server] <--> [Redis Store]
     ^
     |
[Client-side Encryption/Decryption]
```

## 3. API Endpoints

### 3.1 Secret Management Endpoints

#### POST /vault
- Purpose: Store a new encrypted secret
- Request Body:
  ```typescript
  {
    c: string;    // encrypted content
    h: string;    // sha256 hash of encryption key + optional password
    b: boolean;   // burn after reading flag
    ttl: number;  // time-to-live in milliseconds
  }
  ```
- Response (201):
  ```typescript
  {
    id: string;   // vault identifier
    dt: string;   // delete token
  }
  ```

#### GET /vault/:vaultId
- Purpose: Retrieve an encrypted secret
- Query Parameters:
  - h: string (sha256 hash of encryption key + optional password)
- Response (200):
  ```typescript
  {
    c: string;    // encrypted content
    b: boolean;   // burn after reading flag
    ttl: number;  // time-to-live in milliseconds
    _cd: number;  // created date
  }
  ```

#### DELETE /vault/:vaultId
- Purpose: Delete a secret
- Request Body:
  ```typescript
  {
    dt: string;   // delete token
  }
  ```

## 4. Security Measures

### 4.1 Encryption
1. **Client-Side Encryption**
   - AES-256-GCM encryption
   - All encryption/decryption occurs in the browser
   - Unique encryption key per secret
   - Optional password protection (layered encryption)
     - Password is not embedded in the URL and is ideally shared/transmitted separately from the URL

2. **Key Management**
   - Decryption key never transmitted to server
   - Optional password protection
   - SHA-256 key verification

### 4.2 Zero-Knowledge Architecture
1. **Server Security**
   - Server only receives and stores encrypted data
   - Server cannot decrypt content
   - No user accounts or authentication
   - No logging of sensitive data

2. **Data Security**
   - Automatic data expiration (TTL)
   - Burn after reading option
   - No persistent storage
   - Secure deletion from Redis

### 4.3 Transport Security
  - CORS protection
  - Rate limiting
  - Request size limits
  - TLS transport encryption
  - Strict Content Security Policy (CSP)
    - No eval() or unsafe-inline
    - Restricted source origins
    - Frame ancestors disabled
    - Strict MIME type checking
    - XSS protection headers

## 5. Client Implementation

### 5.1 Encryption Process
1. **Creating a Secret**
   - Generate random encryption key
   - Encrypt content with AES-256-GCM
   - Optional: Encrypt again with user password
   - Generate SHA-256 hash of key+password
   - Send encrypted data to server

2. **Retrieving a Secret**
   - Extract key from URL fragment
   - Request encrypted data using ID
   - Verify key hash
   - Decrypt with key (and password if set)
   - Optional: Automatic deletion after reading

## 6. Error Handling

### 6.1 Error Responses
- 400: Invalid key/password
- 404: Secret not found
- 429: Rate limit exceeded
- 500: Server error

## 7. Rate Limiting and Quotas

### 7.1 API Rate Limits
- Configurable per-IP rate limiting
- Default: Specified in server configuration
- Enforced by Redis

### 7.2 Content Limits
- Maximum content size: 50KB
- Minimum TTL: Configurable
- Maximum TTL: Configurable
- Default TTL: Configurable

## 8. Privacy Considerations

### 8.1 Data Privacy
- No user tracking
- No analytics
- No logs of secret content
- No metadata collection

### 8.2 Data Retention
- Automatic expiration
- No backups
- No data recovery
- Immediate deletion post-read (optional)

## 10. Future Considerations

### 10.1 Potential Enhancements
- File encryption support
- Notification of read receipts
- Deferred time to available w/ read-side email subscription for availability notifications

---

This specification is a living document and will be updated as the system evolves.
