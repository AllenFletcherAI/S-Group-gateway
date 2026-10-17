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

## Decision D-003: Multi-Tenant Shipment Repository & Timeline Model
- **Option 1: Direct synchronous carrier proxying**
  - *Cost / Risk:* High latency and cascading failures. If DHL or Schenker has an API outage, customer page requests freeze and fail.
  - *Why rejected:* Breaches reliability requirements; exposes customers directly to third-party outages.
- **Option 2: Single untyped table with client-side filtering**
  - *Cost / Risk:* Massive security vulnerability (IDOR/BOLA). Any user can open developer tools and view raw JSON payloads containing competitor shipments and confidential pricing.
  - *Why rejected:* Violates German DSGVO, commercial confidentiality, and project safety boundaries.
- **Option 3: Tenant-partitioned database queries with timeline aggregation (Chosen)**
  - *Cost / Risk:* Requires asynchronous event storage and strictly scoped database query abstractions.
  - *Why chosen:* Guarantees tenant isolation at the query layer (`WHERE tenant_id = :id`) and delivers instant, resilient sub-millisecond timeline rendering.

## Decision D-004: Production Containerization & Health Orchestration
- **Option 1: Direct bare-metal / VM deployment using PM2**
  - *Cost / Risk:* High risk of host configuration drift, missing OS-level library dependencies, and complex rollback procedures. Hard to replicate staging environments consistently.
  - *Why rejected:* Lacks environment immutability and modern cloud-native orchestrator compatibility.
- **Option 2: Single-stage Docker container running as default root user**
  - *Cost / Risk:* Security violation. Running Node.js as `root` (UID 0) inside a container creates severe privilege escalation risks if an exploit is found. Bloats container size to >500MB with development compilers and source code left inside the image.
  - *Why rejected:* Breaches Lane B security hardening and increases container attack surface.
- **Option 3: Hardened multi-stage Alpine container with non-root user and health orchestration (Chosen)**
  - *Cost / Risk:* Requires maintaining multi-stage build definitions and explicit file copying.
  - *Why chosen:* Produces a tiny ~75MB production image, completely strips TypeScript compilers and dev tools from runtime, runs securely as unprivileged `USER node`, and equips orchestrators with native `/health` probes.

## Decision D-005: Sovereign SVG-Based Live Telematics Map Component
- **Option 1: External third-party map embed (e.g. Google Maps / Mapbox iframe)**
  - *Cost / Risk:* Major DSGVO liability. External mapping iframes download third-party tracking cookies and transmit customer browser IP addresses and destination queries to US cloud providers without user consent. Requires managing paid API tokens with usage limits.
  - *Why rejected:* Breaches German privacy rules and introduces external point of failure.
- **Option 2: Heavy client-side JS library (Leaflet/OpenLayers) with external OpenStreetMap tile server calls**
  - *Cost / Risk:* Adds ~150KB of client JS libraries; external tile server rate limits cause broken map tiles ("gray squares") under high traffic; leaks user IP addresses to OSM tile hosts.
  - *Why rejected:* Fragile in corporate intranets and slows down portal render speed.
- **Option 3: Sovereign, self-contained SVG Vector Telematics Map with reactive CSS beacons (Chosen)**
  - *Cost / Risk:* Does not support arbitrary street-level zooming.
  - *Why chosen:* Zero external requests, zero cookie tracking, 100% DSGVO compliant, instant render speed, WCAG AA contrast, and elegant corridor telemetry display.

## Decision D-006: German DSGVO Telematics Pruning Engine & Art. 15 Export
- **Option 1: Manual DBA batch delete scripts**
  - *Cost / Risk:* Prone to human error, missed schedules, and zero customer visibility. If a script fails silently, unpruned PII accumulates and causes non-compliance liabilities during audits.
  - *Why rejected:* Lack of automated repeatability and verifiable audit logging.
- **Option 2: Client-side visual expiration**
  - *Cost / Risk:* Severe DSGVO violation. Filtering out coordinates in JavaScript while retaining raw coordinates in the database violates Art. 5 (Storage Limitation). An attacker or insider can still access old driver trails.
  - *Why rejected:* Fails fundamental data protection standards.
- **Option 3: Automated Telematics Pruning Engine with immutable audit ledger and Art. 15 export (Chosen)**
  - *Cost / Risk:* Requires maintaining automated retention window logic and data aggregation pipelines.
  - *Why chosen:* Provides guaranteed deletion of raw GPS telemetry past 90 days, maintains permanent macro-milestones, logs every purge event with ISO 27001 audit receipts, and allows instant customer export.

## Decision D-007: Sliding-Window Rate Limiting & DoS Shield
- **Option 1: Fixed-Window Counter**
  - *Cost / Risk:* Traffic burst vulnerability. If a client sends its limit in the last second of a minute and sends another full limit in the first second of the next minute, it achieves a 2x rate burst in 2 seconds, which can overwhelm the backend.
  - *Why rejected:* Flawed burst defense compared to sliding-window algorithms.
- **Option 2: Cloud WAF / External API Gateway**
  - *Cost / Risk:* Vendor lock-in (e.g. AWS WAF / Cloudflare), additional recurring cloud costs, and egress latency. Tests cannot run completely offline or in isolated corporate environments.
  - *Why rejected:* Undermines self-contained sovereign architecture and local test speed.
- **Option 3: Sliding-Window Rate Limiter Middleware (Chosen)**
  - *Cost / Risk:* Requires tracking request timestamp arrays in memory.
  - *Why chosen:* Completely prevents boundary bursts, emits standard `X-RateLimit-*` and `Retry-After` headers, runs with 0 cloud dependencies, and scales cleanly.

## Decision D-008: Multi-Modal Feeder Dispatch & Capacity Tour Planning
- **Option 1: External TMS iframe integration**
  - *Cost / Risk:* Fragmented user experience, recurring third-party software licensing fees, and vendor authentication lock-in. Cross-origin iframe boundaries make unified portal search impossible.
  - *Why rejected:* Breaches architectural sovereignty and adds unnecessary recurring cost.
- **Option 2: Offline spreadsheet batch upload**
  - *Cost / Risk:* High risk of human entry error, stale data, and zero live validation against vehicle gross weight limits or ADR dangerous goods segregation.
  - *Why rejected:* Fails real-time operational safety standards for Lane B logistics.
- **Option 3: Integrated Multi-Modal Dispatch Repository (Chosen)**
  - *Cost / Risk:* Requires developing and maintaining internal tour models and capacity calculators.
  - *Why chosen:* Directly unifies seaport container arrivals with feeder road and rail allocation, enforces physical pallet/weight capacity bounds, verifies ADR compliance, and strictly pseudonymizes driver records for German DSGVO compliance.

## Decision D-009: Enterprise Scoped API Keys & Native Constant-Time JWT RBAC
- **Option 1: HTTP Basic Authentication**
  - *Cost / Risk:* Transmits static credentials across every HTTP request, lacks scope granularity, and provides no built-in token expiration or tenant claim validation.
  - *Why rejected:* Inadequate security model for enterprise B2B freight gateways.
- **Option 2: External Identity Provider SaaS (Auth0 / Okta)**
  - *Cost / Risk:* Adds external latency to every authenticated request, incurs steep monthly subscription costs per B2B customer, and fails when disconnected from the public internet.
  - *Why rejected:* Breaches architectural sovereignty and impairs air-gapped container deployments.
- **Option 3: Sovereign Native Constant-Time API Key & Scoped JWT RBAC Engine (Chosen)**
  - *Cost / Risk:* Requires maintaining internal key registry and token signature helpers.
  - *Why chosen:* Guarantees sub-millisecond authentication, uses Node.js `crypto.timingSafeEqual` against timing attacks, strictly enforces role scopes (`shipments:read`, `dispatch:manage`, `compliance:audit`), binds tenant identity to eliminate IDOR spoofing, and introduces zero third-party dependencies.

## Decision D-010: PostgreSQL Production Relational Schema Migrations & Storage Persistence
- **Option 1: Heavy ORM Framework (TypeORM / Prisma)**
  - *Cost / Risk:* Requires compiling heavy native binaries (Prisma query engine), increases container image size by over 100MB, slows container boot by 3 to 5 seconds, and obscures database indexes behind leaky abstractions.
  - *Why rejected:* Breaches lightweight Alpine container discipline and hinders fine-grained SQL optimization.
- **Option 2: Runtime Dynamic Schema Generation**
  - *Cost / Risk:* Highly dangerous in production. Auto-syncing tables on server start risks accidental table drops, missing rollback paths, and untracked schema drift across staging and production clusters.
  - *Why rejected:* Violates Habit 05, Habit 07, and enterprise auditability standards.
- **Option 3: Native Versioned SQL Migration Engine with Checksummed Transaction DDL (Chosen)**
  - *Cost / Risk:* Requires maintaining explicit SQL migration scripts and schema checksum tracking.
  - *Why chosen:* Provides transparent, version-controlled DDL files (`V001` through `V005`), enforces physical capacity and gross weight CHECK constraints directly in PostgreSQL, tracks migration checksums in `schema_migrations`, runs in under 100ms, and enables instant rollback scripts.



