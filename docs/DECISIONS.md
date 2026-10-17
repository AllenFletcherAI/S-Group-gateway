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
What We Gave Up: Detailed micro-GPS telemetry cannot be retrieved for forensic route analysis beyond 90 days.
Revisit If: German Federal Office for Goods Transport (BALM / formerly BAG) mandates longer retention for specialized hazardous materials (ADR).

