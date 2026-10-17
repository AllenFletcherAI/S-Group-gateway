# Architectural Decisions Log

> Draft every non-trivial decision BEFORE writing code (Habits 02, 11, 14, 17).
> Always record the active AI model name and version, rejected alternatives, and revisit conditions.

## D-001: Project Tools, Modular Architecture, and Core Technology Stack
Date: 2026-10-18  Model: Gemini 3.8 Flash (High)
Problem Context: We are building the S-Group Gateway for Schäfer & SIS Interlogistik in Lane B (Customer-Facing). We need a high-performance, modular system to process carrier telematics and serve a branded customer tracking portal. We must enforce strict German privacy (DSGVO), customer isolation, and modular structure without giant single-file scripts.
Options Looked At:
  1) Single-file script or monolithic framework with embedded styling and in-memory storage
  2) Go microservice architecture using gRPC and compiled native binaries
  3) Modular TypeScript architecture using Fastify, Zod runtime validation, PostgreSQL, and clean frontend components (Chosen)
What We Chose: Option 3
Plain Reason Why:
  - TypeScript + Zod validates every incoming carrier webhook and API request at compile-time and runtime, catching corrupted payloads before they touch database tables.
  - Fastify provides fast HTTP request processing and an encapsulated plugin model that cleanly isolates routes, adapters, services, and repositories.
  - Keeps individual files small, testable, and under strict separation of concerns (no 300KB scripts).
  - PostgreSQL provides ACID compliance and indexed tenant isolation (`tenant_id`) required for German DSGVO multi-tenancy.
What We Gave Up: Requires a TypeScript compilation step and strict Zod schema definitions upfront compared to rapid throwaway scripts.
Revisit If: Telematics ingestion volume exceeds 50,000 events per second, justifying a distributed message streaming engine (e.g. Apache Kafka).

## D-002: Carrier Webhook Cryptographic Verification & Schema Normalization
Date: 2026-10-18  Model: Gemini 3.8 Flash (High)
Problem Context: Partner logistics carriers (DHL, DB Schenker, Maersk) transmit status updates and telematics over public internet webhooks. We must verify sender identity, detect payload tampering, reject replayed requests, and sanitize inputs to prevent injection attacks and corrupt records.
Options Looked At:
  1) Shared API query tokens in the URL (`?token=secret`)
  2) Mutual TLS (mTLS) with client certificates required at the load balancer
  3) HMAC-SHA256 request signatures with sliding timestamp replay protection and Zod validation (Chosen)
What We Chose: Option 3
Plain Reason Why:
  - Query parameters leak into reverse-proxy access logs and do not guarantee payload integrity if someone tampers with the request body in transit.
  - mTLS is operationally rigid and difficult for legacy carrier systems to rotate and manage without shipping delays.
  - HMAC-SHA256 verifies that the exact payload body was signed by the carrier holding the shared secret, while a 5-minute timestamp window stops replay attacks.
  - Zod schemas parse and normalize heterogeneous carrier event codes into strict, unified S-Group milestone enums before business logic executes.
What We Gave Up: Requires CPU overhead to compute cryptographic hashes for each incoming webhook and managing carrier secret keys.
Revisit If: An enterprise client or national customs authority mandates hardware-backed certificates (e.g. AS2 EDI or certified mTLS).

## D-003: Multi-Tenant Shipment Repository & Unified Timeline Domain Model
Date: 2026-10-18  Model: Gemini 3.8 Flash (High)
Problem Context: Customers require a real-time freight tracking timeline and customs document archive. We must merge static shipment manifests with dynamic ingested carrier events while strictly enforcing multi-tenant isolation (zero IDOR) under German DSGVO standards.
Options Looked At:
  1) Direct synchronous carrier proxying (querying external carrier APIs whenever a customer loads the page)
  2) Single global untyped repository with browser-side filtering by tenant
  3) Internal Unified Shipment Repository with mandatory tenant-partitioned queries (`WHERE tenant_id = :tenant_id`) and chronological milestone aggregation (Chosen)
What We Chose: Option 3
Plain Reason Why:
  - Synchronous carrier proxying is fragile; carrier API downtime or latency freezes customer screens.
  - Client-side filtering in JavaScript leaks entire database tables across the network, violating DSGVO and Habit 18 (IDOR vulnerability).
  - A tenant-partitioned repository guarantees that database queries return only records matching the authenticated customer's `tenant_id`. Dynamic milestone aggregation cleanly merges ingested DHL, Schenker, and Maersk events into an intuitive visual timeline.
## D-004: Production Containerization, Non-Root Execution, and Health Orchestration
Date: 2026-10-18  Model: Gemini 3.8 Flash (High)
Problem Context: We need a secure, reproducible, and portable deployment artifact for the S-Group Gateway for staging and production hosting (e.g. AWS ECS, Kubernetes, or German sovereign cloud providers like Hetzner/IONOS). We must prevent configuration drift, minimize container attack surface, enforce non-root execution, and ensure automated container orchestrator health checks.
Options Looked At:
  1) Direct bare-metal / VM deployment using PM2 process manager
  2) Single-stage Docker container running as default root user
  3) Hardened multi-stage Alpine container running as unprivileged `node` user with native health check and Docker Compose orchestration (Chosen)
What We Chose: Option 3
Plain Reason Why:
  - Multi-stage build separates build-time dependencies (`typescript`, `tsx`, `@types/*`) from production runtime, shrinking image size by ~85% (from ~500MB down to ~75MB).
  - Enforces unprivileged execution (`USER node`) so container breakout vulnerabilities cannot compromise host OS resources.
  - Native `HEALTHCHECK` directive allows Docker and Kubernetes orchestrators to automatically query `/health` and recycle degraded instances.
  - `docker-compose.yml` provides reproducible local staging with parameterizable environment variables.
## D-005: Sovereign SVG-Based Live Telematics Map Component
Date: 2026-10-18  Model: Gemini 3.8 Flash (High)
Problem Context: Enterprise logistics customers want to visualize their cargo's physical transit corridor, intermediate customs/port waypoints, and current vehicle or vessel position. We must comply with German DSGVO / TTDSG (zero third-party trackers or IP leaks to external mapping CDNs) while delivering a responsive, high-contrast, interactive map with official S-Group branding.
Options Looked At:
  1) External third-party map embed (e.g. Google Maps / Mapbox iframe)
  2) Heavy client-side JS library (Leaflet/OpenLayers) downloading third-party OpenStreetMap raster tiles
  3) Sovereign, self-contained SVG Vector Telematics Map with reactive CSS beacons and zero external network calls (Chosen)
What We Chose: Option 3
Plain Reason Why:
  - Eliminates German DSGVO & TTDSG compliance risks: avoids loading third-party scripts that leak customer IP addresses and freight query identifiers to foreign servers.
  - Zero external dependencies: operates reliably without external API keys, rate limits, or network tile failures.
  - High performance & accessibility: pure vector SVG (<15KB), zero bundle bloat, responsive 8px grid layout, and WCAG AA contrast with S-Group Deep Navy (`#0B192C`) and Signal Blue (`#0284C7`).
  - Respects driver privacy constraint (Habit 20): displays corridor macro-waypoints rather than invasive street-level driver tracking.
## D-006: German DSGVO Telematics Pruning Engine & Art. 15 Data Portability Export
Date: 2026-10-18  Model: Gemini 3.8 Flash (High)
Problem Context: German privacy law (DSGVO Art. 5(1)(e) & Art. 15) mandates that driver telematics data cannot be stored indefinitely, requiring automated pruning of raw GPS coordinates after 90 days while providing enterprise tenants with verifiable data portability exports.
Options Looked At:
  1) Manual database batch delete scripts executed ad-hoc by database administrators
  2) Client-side visual expiration (hiding old coordinates in UI while retaining raw PII in database)
  3) Built-in Automated Telematics Pruning Engine with immutable audit ledger and Art. 15 cryptographic JSON export (Chosen)
What We Chose: Option 3
Plain Reason Why:
  - Guarantees strict compliance with German DSGVO Art. 5: automatically purges high-frequency driver telematics older than 90 days while safely preserving permanent business milestones ("Delivered", "Customs Cleared").
  - Produces an immutable, timestamped audit log of every pruning sweep that enterprise compliance officers can inspect live in the portal.
  - Implements Art. 15 Right of Access via authenticated, SHA-256 hashed JSON data export for the customer.
## D-007: Sliding-Window Rate Limiting & DoS Shield Middleware
Date: 2026-10-18  Model: Gemini 3.8 Flash (High)
Problem Context: Public carrier webhook endpoints and client query APIs are exposed to the public internet and susceptible to volumetric DoS floods, bot traffic, and rogue carrier retry loops. We must throttle abusive traffic, protect event-loop availability, and return standardized HTTP 429 responses with `Retry-After` headers.
Options Looked At:
  1) Fixed-Window Counter (vulnerable to double-burst traffic surges right at minute boundaries)
  2) Proprietary external cloud WAF / API Gateway requiring vendor lock-in and extra egress latency
  3) Sliding-Window Rate Limiter Middleware with standard HTTP headers (`X-RateLimit-*`, `Retry-After`) and Redis-ready driver interface (Chosen)
What We Chose: Option 3
Plain Reason Why:
  - Sliding-window tracking accurately prevents traffic spikes across sliding intervals without the boundary burst vulnerability of fixed counters.
  - Operates locally with zero vendor lock-in and zero external network calls, keeping test suites fast and staging air-gapped.
  - Configures dedicated buckets: Carrier Webhooks (60 req/min), Query APIs (100 req/min), and Compliance Pruning (10 req/min).
  - Emits standard RFC rate limit headers (`X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`) and returns HTTP 429 with `Retry-After`.
## D-008: Multi-Modal Feeder Dispatch & Capacity Tour Planning Architecture
Date: 2026-10-18  Model: Gemini 3.8 Flash (High)
Problem Context: Seaport container arrivals in Hamburg and cross-border European cargo require coordinated feeder dispatch (road truck, rail, inland waterway) to inland distribution hubs. Dispatchers need real-time capacity tracking (pallets/weight), ADR hazardous cargo validation, and shipment assignment without violating driver privacy laws (DSGVO).
Options Looked At:
  1) External third-party Transportation Management System (TMS) iframe embed
  2) Synchronous Excel/CSV spreadsheet upload pipeline without live validation
  3) Integrated Multi-Modal Dispatch Repository with capacity validation, ADR hazardous goods checks, and pseudonymized driver scheduling (Chosen)
What We Chose: Option 3
Plain Reason Why:
  - Keeps dispatch operations fully integrated into the S-Group Gateway portal with zero third-party licensing costs or authentication silos.
  - Enforces strict vehicle capacity invariants: validates pallet counts and gross weight limits before allowing shipments to be booked onto feeder tours.
  - Validates ADR hazardous goods segregation according to European road transport safety rules.
  - Respects German privacy law (DSGVO): assigns pseudonymized worker IDs (`DRV-HAM-491`) instead of real employee personal names on customer manifests.
What We Gave Up: Dynamic algorithmic traffic rerouting (which requires live third-party telematics subscriptions).
Revisit If: Active feeder operations scale past 500 simultaneous vehicles, requiring automated combinatorial route optimization.

## D-009: Enterprise Scoped API Keys & Native Constant-Time JWT RBAC Architecture
Date: 2026-10-18  Model: Gemini 3.8 Flash (High)
Problem Context: Public API endpoints for freight tracking, dispatch booking, and DSGVO compliance operations require fine-grained access control. Unauthenticated clients must be blocked, and authorized clients must be restricted to their granted permission scopes (`shipments:read`, `dispatch:manage`, `compliance:audit`). Tenant context must be cryptographically bound to credentials to prevent spoofing of `X-Tenant-Id` headers (Zero IDOR / BOLA).
Options Looked At:
  1) HTTP Basic Authentication (username:password credentials passed over headers with no scope granularity)
  2) External SaaS Identity Provider (Auth0 / Okta) requiring third-party network egress and subscription lock-in
  3) Sovereign Native Constant-Time API Key & Scoped JWT RBAC Engine using Node.js `crypto` (timingSafeEqual) with scope guard middleware (Chosen)
What We Chose: Option 3
Plain Reason Why:
  - Native Node.js `crypto.timingSafeEqual` prevents timing side-channel attacks when validating API keys.
  - Enforces least privilege via explicit scopes: a customer ERP key with `shipments:read` cannot trigger compliance purges (`compliance:audit`) or dispatch freight (`dispatch:manage`).
  - Cryptographically anchors `tenantId` to the credential, overriding arbitrary client-supplied headers and enforcing Zero IDOR / BOLA.
  - Zero external npm dependencies keeps the build completely self-contained and avoids supply-chain vulnerabilities.
What We Gave Up: User-facing self-service OAuth2 consent screens (unnecessary for Phase 1 B2B logistics gateway).
Revisit If: Platform expands to public third-party app marketplace with delegated user consent.

## D-010: PostgreSQL Production Relational Schema Migrations & Persistence Engine
Date: 2026-10-18  Model: Gemini 3.8 Flash (High)
Problem Context: Production deployment requires an ACID-compliant relational schema enforcing tenant foreign keys, check constraints on vehicle load bounds, composite performance indexes, and automated schema migration tracking. The migration runner must be versioned, idempotent, and checksummed without adding heavy ORM dependencies that slow down container startup or air-gapped test runs.
Options Looked At:
  1) Heavy ORM framework (TypeORM / Prisma) requiring native engine binaries and generating unpredictable multi-join SQL
  2) Dynamic runtime schema generation (auto-creating unversioned tables on first write)
  3) Native Versioned SQL Migration Engine with Checksummed Transaction DDL & Decoupled Repository Drivers (Chosen)
What We Chose: Option 3
Plain Reason Why:
  - Raw SQL DDL migrations (`V001` through `V005`) provide 100% clarity, explicit index definitions, and direct PostgreSQL execution.
  - Database-level physical safety invariants: enforces `CHECK (loaded_pallets <= max_pallets)` and `CHECK (loaded_weight_kg <= max_weight_kg)` directly in the database engine.
  - Tracks migration versions in `schema_migrations` with cryptographic SHA-256 checksums to detect file drift or tampering.
  - Decoupled driver architecture allows instant offline verification during tests while seamlessly binding to production PostgreSQL via `DATABASE_URL`.
What We Gave Up: Automatic GUI database administrative dashboard (handled via standard pgAdmin or CLI).
Revisit If: Database sharding across multi-region clusters is required in future European expansion phases.



