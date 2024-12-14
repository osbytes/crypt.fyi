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
- API Server
- Data Store (Ephemeral storage)

### 2.2 Component Interaction Flow
```
[Web Client] <--> [API Server] <--> [Data Store]
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
    cd: number;  // created date time (unix timestamp)
  }
  ```
- Error Responses:
  - 400: Invalid key/password hash
  - 404: Secret not found or already burned
  - 429: Rate limit exceeded
  - 500: Server error

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
   - AES-256-GCM encryption with PBKDF2 key derivation and random salt and initialization vector (IV)
   - Unique encryption key per secret
   - All encryption/decryption occurs in the browser
   - Optional password protection for layered encryption
     - Password is not embedded in the URL and is ideally shared/transmitted to the recipient separately from the unique vault URL

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
     - Must be implemented using atomic operations
     - Must guarantee exactly one successful read when burn is enabled
     - Must prevent race conditions in concurrent access scenarios
   - No persistent storage
   - Secure deletion of data

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

## 5. Data Storage Requirements

### 5.1 Storage Properties
1. **Ephemeral Nature**
   - All data must be temporary
   - Configurable Time-To-Live (TTL) per entry
   - Automatic expiration and cleanup

2. **Concurrency Requirements**
   - Must support concurrent access
   - Must maintain data consistency
   - Must provide atomic operations for critical functions
     - Especially for burn-after-reading functionality
     - For deletion operations

3. **Performance Requirements**
   - Fast read and write operations
   - Efficient handling of concurrent requests
   - Scalable storage solution

### 5.2 Data Integrity
1. **Consistency**
   - Atomic operations where required
   - Proper handling of race conditions
   - Guaranteed execution order for critical operations

2. **Reliability**
   - Data available until expiration or deletion
   - Proper error handling
   - Recovery from system failures

## 6. Client Implementation

### 6.1 Encryption Process
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

## 7. System Constraints

### 7.1 API Rate Limits
- Configurable per-IP rate limiting
- Default: Specified in server configuration
- Must be enforced at the API level

### 7.2 Content Limits
- Maximum content size: 50KB
- Enforced at the API level

## 8. Error Handling

### 8.1 Error Responses
- 400: Invalid key/password hash
- 404: Secret not found or already burned
- 429: Rate limit exceeded
- 500: Server error

Each error response will have an appropriate error message in the response body.

## 9. Rate Limiting and Quotas

### 9.1 API Rate Limits
- Per-IP rate limiting enforced
- Configurable rate limit window and request quota
- Rate limits apply to all API endpoints

### 9.2 Content Limits
- Maximum content size: 50KB
- TTL Constraints:
  - Minimum: 1 second
  - Maximum: 7 days
  - Default: 1 hour

## 10. Security Measures

### 10.1 Transport Security
- Mandatory HTTPS for all API endpoints
- Strict Transport Security (HSTS) enforcement
- Modern TLS protocols only

### 10.2 Security Headers
- Content Security Policy (CSP)
  - No eval() or unsafe-inline
  - Restricted source origins
  - Frame ancestors disabled
  - Strict MIME type checking
- Cross-Origin Resource Sharing (CORS)
  - Strict origin validation
  - Limited allowed methods
  - Controlled header exposure
- XSS Protection Headers
- Content Type Options
- Referrer Policy

### 10.3 Request/Response Security
- Request size limits
- Response sanitization
- No sensitive data in logs
- Secure error handling

## 11. Future Considerations

### 11.1 Potential Enhancements
- File encryption support
- Notification of read receipts
- Deferred time to available w/ read-side email subscription for availability notifications
- IP whitelisting / blacklisting
- QR code support
- Browser extension

---

This specification is a living document and will be updated as the system evolves.
