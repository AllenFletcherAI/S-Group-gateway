# Architectural Alternatives & Rejected Options

> For every significant choice, write down the options you rejected and why (Habit 17).
> Without alternatives, every choice sounds like the only possible one, and that is a red flag.

## Decision D-001: Project Tools, Modular Architecture, and Technology Stack
- **Option 1: Single-file script or monolithic framework with embedded styling and in-memory storage**
  - *Cost / Risk:* Violates Habit 12 and project constraints (produces 300KB+ spaghetti code). Zero type safety; in-memory data disappears on crash; impossible to defend or audit for German privacy compliance.
  - *Why rejected:* Fails customer safety and maintainability requirements for Lane B.
- **Option 2: Go microservice architecture with gRPC and compiled native binaries**
  - *Cost / Risk:* High development friction and ceremony; dual-stack frontend/backend context switching slows down portal delivery; unnecessary operational overhead for current throughput requirements.
  - *Why rejected:* Premature complexity. Node.js / TypeScript provides unified language across edge gateway and portal UI with sufficient I/O performance.
- **Option 3: Modular TypeScript stack with Fastify, Zod, PostgreSQL, and clean frontend components (Chosen)**
  - *Cost / Risk:* Requires TypeScript build configuration and strict schema declarations.
  - *Why chosen:* Provides runtime and compile-time boundary safety, high HTTP performance, and clean modular isolation across files without giant scripts.
  - *Revisit if:* Telematics ingestion scales past 50,000 events/second, requiring distributed message streaming.
## Decision D-002: Carrier Webhook Cryptographic Verification
- **Option 1: Shared query token in URL (`?token=secret`)**
  - *Cost / Risk:* High risk of token exposure. Query parameters are logged in plaintext across intermediate proxies, load balancers, and monitoring tools. Does not verify payload integrity; an attacker could alter status codes while keeping the valid token.
  - *Why rejected:* Insecure against payload tampering and creates credential leakage liabilities.
- **Option 2: Mutual TLS (mTLS) with client certificates**
  - *Cost / Risk:* Heavy administrative burden. Third-party logistics carriers frequently struggle with certificate expiration and rotating private keys, causing blocked webhook delivery and shipment delays.
  - *Why rejected:* Operational fragility for partner carriers.
- **Option 3: HMAC-SHA256 signatures with 5-minute sliding replay window (Chosen)**
  - *Cost / Risk:* Requires computing cryptographic hashes per request and securely distributing per-carrier shared secrets in environment configuration.
  - *Why chosen:* Provides cryptographically verified integrity and sender authenticity while supporting standard HTTP webhook delivery from all carriers.
