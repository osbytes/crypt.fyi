RFC XXXX                    crypt.fyi Protocol                January 2025


                    crypt.fyi System Specification

Status of This Memo

   This document specifies the crypt.fyi protocol for secure, ephemeral
   secret sharing. It describes the architecture, security model, and
   implementation requirements for a zero-knowledge secret sharing
   platform using post-quantum cryptography.

Copyright Notice

   Copyright (c) 2025 crypt.fyi contributors. All rights reserved.

Abstract

   This document defines the crypt.fyi protocol, a system for secure,
   ephemeral sharing of sensitive information using post-quantum
   cryptography. The protocol implements a zero-knowledge architecture
   where encrypted secrets are stored temporarily on a server that
   cannot decrypt the content. The system supports features including
   burn-after-reading, time-based expiration, IP restrictions, read
   count limits, and webhook notifications.

Table of Contents

   1. Introduction
   2. Protocol Overview
   3. Cryptographic Specifications
   4. Message Formats
   5. API Endpoints
   6. Security Considerations
   7. Implementation Requirements
   8. Error Handling
   9. IANA Considerations
   10. References

1. Introduction

1.1. Purpose

   crypt.fyi is a zero-knowledge, end-to-end encrypted secret sharing
   platform that enables users to securely share sensitive information
   using ML-KEM post-quantum encryption. The system is designed with a
   "zero-knowledge" architecture, meaning the server never has access
   to unencrypted data or encryption keys.

1.2. Scope

   This document outlines the system architecture, security measures,
   and interaction patterns between client and server components of the
   crypt.fyi system.

2. Protocol Overview

2.1. Architecture Components

   crypt.fyi follows a client-server architecture with the following
   main components:

   o  Web Client (Browser-based interface)
   o  Web Server (Static file server)
   o  API Server
   o  Data Store (Redis for ephemeral storage)

2.2. Component Interaction Flow

   [Web Client] <--> [Web Server] // Serves static files only
   [Web Client] <--> [API Server] <--> [Redis Data Store]
        ^
        |
   [Client-side Encryption/Decryption]

2.3. Zero-Knowledge Proof Mechanism

   The protocol implements a zero-knowledge proof system where the server
   can verify that a client possesses the correct decryption key without
   ever seeing the key itself:

   1. Client generates a random encryption key during secret creation
   2. Client optionally combines key with user-provided password
   3. Client computes SHA-512 hash of (key + password)
   4. Server stores encrypted content alongside the hash
   5. During retrieval, client proves knowledge by providing the same hash
   6. Server releases encrypted content only upon hash verification
   7. Client performs decryption locally using the original key/password

2.4. URL Fragment Security

   The decryption key MUST be passed in the URL fragment (after the #
   symbol) to prevent transmission to the server:

   Example URL structure:
   https://crypt.fyi/v/{vaultId}#{base64-encoded-key}

   URL fragments are processed entirely client-side by the browser and
   are never sent to the server in HTTP requests. This ensures that:

   o  Web server logs never contain decryption keys
   o  Network intermediaries cannot observe keys
   o  Server-side code cannot accidentally log or process keys
   o  The zero-knowledge architecture is maintained

2.5. Server Separation

   The system deliberately separates the web server (serving static
   files) from the API server for enhanced security:

2.5.1. Web Server

   o  MUST serve only static files (HTML, CSS, JS)
   o  MUST be configured to strip URL query parameters and fragments
      from request logging
   o  MUST be configured with strict Content Security Policy (CSP)
   o  SHOULD run on a separate server/hosting platform from API server

2.5.2. API Server

   o  MUST handle only encrypted data operations
   o  MUST NOT receive or process URLs containing decryption keys
   o  MUST only receive hashed keys for verification (SHA-512)
   o  MUST operate independently from web server

   This separation ensures that even if the web server logs are
   compromised, the decryption keys remain secure as they are never
   transmitted to any server component.

3. Cryptographic Specifications

3.1. Encryption Algorithms

   The system supports multiple encryption algorithms identified by
   algorithm identifiers:

   o  "aes-256-gcm": AES-256 in Galois/Counter Mode
   o  "ml-kem-768": ML-KEM-768 post-quantum algorithm (legacy)
   o  "ml-kem-768-2": ML-KEM-768 with ChaCha20-Poly1305 (current)

3.1.1. ML-KEM-768-2 (Recommended)

   Implementations using ML-KEM-768-2 MUST use:
   o  ML-KEM-768 for key encapsulation
   o  SHA3-512 for key derivation from password and salt
   o  ChaCha20-Poly1305 for symmetric encryption
   o  32-byte random salt
   o  12-byte random initialization vector

3.1.2. Key Derivation

   Key derivation process for ML-KEM-768-2:
   1. Generate 32-byte random salt
   2. Derive key using SHA3-512(password || salt)
   3. Generate ML-KEM-768 keypair using derived key
   4. Perform key encapsulation to get shared secret
   5. Use shared secret with ChaCha20-Poly1305

3.2. Hash Functions

   Implementations MUST use:
   o  SHA-512 for key verification hash (key + optional password)
   o  SHA3-512 for key derivation in ML-KEM-768-2

3.3. Compression

   Implementations MAY use optional compression:
   o  "zlib:pako": zlib compression via pako library
   o  "none": no compression (default)

4. Message Formats

4.1. Vault Entry Structure

   {
     "c": "<base64-encoded-encrypted-content>",
     "h": "<sha512-hash-of-key-and-password>",
     "m": {
       "compression": {
         "algorithm": "zlib:pako" | "none"
       },
       "encryption": {
         "algorithm": "aes-256-gcm" | "ml-kem-768" | "ml-kem-768-2"
       }
     },
     "b": <boolean-burn-after-reading>,
     "dt": "<delete-token>",
     "ttl": <time-to-live-milliseconds>,
     "cd": <created-date-timestamp>,
     "ips": "<encrypted-ip-cidr-allowlist>",
     "rc": <read-count-limit>,
     "fc": <failed-attempts-limit>,
     "wh": {
       "u": "<encrypted-webhook-url>",
       "n": "<webhook-name>",
       "r": <notify-on-read>,
       "fpk": <notify-on-failed-key>,
       "fip": <notify-on-failed-ip>,
       "b": <notify-on-burn>
     }
   }

5. API Endpoints

   Complete API specification available at: https://api.crypt.fyi/docs

5.1. Create Vault Entry

   POST /vault
   
   Creates a new vault entry with encrypted content.

5.2. Retrieve Vault Entry

   GET /vault/{vaultId}?h={hash}
   
   Retrieves vault content using vault ID and key hash.

5.3. Check Vault Existence

   HEAD /vault/{vaultId}
   
   Checks if a vault entry exists without retrieving content.

5.4. Delete Vault Entry

   DELETE /vault/{vaultId}
   
   Deletes vault entry using delete token.

6.1. Zero-Knowledge Architecture

   The system implements true zero-knowledge security where the server
   can verify client authorization without learning any sensitive
   information:

   o  Server MUST only receive and store encrypted data
   o  Server MUST NOT be able to decrypt content under any circumstances
   o  No user accounts or authentication MUST be required
   o  Server MUST NOT log sensitive data or encryption keys
   o  Decryption keys MUST NOT be transmitted to server due to URL
      fragment usage
   o  Client MUST prove key possession through cryptographic hash
      verification
   o  Hash MUST NOT be reversible to obtain the original key or password
   o  Even with full API server compromise, encrypted data MUST remain
      secure

6.2. Data Security

   o  Data MUST have automatic expiration (TTL: 1 second to 7 days)
   o  Burn after reading MUST use atomic Redis operations
   o  Read count limits MUST NOT exceed 10 reads
   o  Failed attempt limits MUST be between 1-10 attempts before burning
   o  Implementation MUST NOT use persistent storage - ephemeral Redis
      storage only
   o  Data MUST be securely deleted upon expiration or burning

6.3. Access Control

   o  IP address restrictions MAY use CIDR notation
   o  Implementations MUST NOT allow more than 3 IP restrictions per
      vault entry
   o  Key authentication MUST use SHA-512 hash verification

6.4. Transport Security

   o  All API endpoints MUST use HTTPS
   o  CORS protection MUST be implemented with configurable origins
   o  Rate limiting MUST be enforced (default: 10 requests per minute
      per IP)
   o  Request size limits MUST be enforced (default: 100KB)
   o  Strict Content Security Policy (CSP) MUST be implemented:
     - eval() and unsafe-inline MUST NOT be allowed
     - Source origins MUST be restricted
     - Frame ancestors MUST be disabled
     - MIME type checking MUST be strict
   o  Security headers MUST be implemented (HSTS, XSS protection, etc.)

6.5. Webhook Security

   o  Webhook URLs MUST be encrypted in storage
   o  Retry attempts MUST be configurable with a maximum of 5
   o  Request timeout protection MUST be implemented (3 seconds default)
   o  Implementations MAY send event notifications for:
     - Successful reads
     - Failed authentication attempts
     - IP access violations
     - Secret burning

7. Implementation Requirements

7.1. Storage Requirements

7.1.1. Redis Configuration

   o  Implementations MUST use ephemeral storage (Redis recommended)
   o  TTL per entry MUST be configurable (1 second to 7 days)
   o  Automatic expiration and cleanup MUST be implemented
   o  Atomic operations MUST be used for critical functions:
     - Burn-after-reading implementation
     - Read count decrementation
     - Failed attempt tracking

7.1.2. Concurrency Requirements

   o  Implementations MUST support concurrent access
   o  Data consistency MUST be maintained using atomic transactions
   o  Atomic operations SHOULD use Lua scripts to prevent race conditions
   o  Concurrent read/delete operations MUST be handled properly

7.1.3. Performance Requirements

   o  Read and write operations SHOULD be optimized for speed
   o  Concurrent requests MUST be handled efficiently
   o  Storage deployment SHOULD be scalable
   o  Connection pooling SHOULD be used for optimal performance

7.2. Server Configuration

7.2.1. Environment Variables

   Key configuration parameters:
   o  REDIS_URL: Redis connection string
   o  ENCRYPTION_KEY: Server-side encryption key for metadata
   o  RATE_LIMIT_MAX: Maximum requests per time window
   o  BODY_LIMIT_BYTES: Maximum request body size
   o  CORS_ORIGIN: Allowed CORS origins
   o  WEBHOOK_*: Webhook configuration parameters

7.2.2. Default Limits

   o  Vault entry TTL SHOULD default to 1 hour (MUST be configurable:
      1s to 7 days)
   o  Body limit SHOULD default to 100KB
   o  Rate limit SHOULD default to 10 requests per minute per IP
   o  IP restrictions MUST NOT exceed 3 per vault
   o  Read count MUST NOT exceed 10
   o  Vault ID length SHOULD be 20 characters
   o  Delete token length SHOULD be 20 characters

8. Error Handling

8.1. HTTP Status Codes

   o  200: Success
   o  201: Vault entry created successfully  
   o  400: Invalid key/password hash or malformed request
   o  404: Vault entry not found or already burned
   o  429: Rate limit exceeded
   o  500: Internal server error

8.2. Error Response Format

   Error responses include appropriate error messages in the response
   body following standard HTTP error response patterns.

9. IANA Considerations

   This document does not require any IANA actions. The protocol uses
   standard HTTP methods and does not define new URI schemes, media
   types, or other values requiring IANA registration.

10. References

10.1. Normative References

   [RFC2119]  Bradner, S., "Key words for use in RFCs to Indicate
              Requirement Levels", BCP 14, RFC 2119, March 1997.

   [RFC8446]  Rescorla, E., "The Transport Layer Security (TLS)
              Protocol Version 1.3", RFC 8446, August 2018.

10.2. Informative References

   [ML-KEM]   National Institute of Standards and Technology,
              "Module-Lattice-based Key-Encapsulation Mechanism
              Standard", FIPS 203, August 2024.

   [ChaCha20] Nir, Y. and A. Langley, "ChaCha20 and Poly1305 for IETF
              Protocols", RFC 8439, June 2018.

Authors' Addresses

   crypt.fyi contributors
   Email: hi@crypt.fyi
   URI:   https://crypt.fyi
