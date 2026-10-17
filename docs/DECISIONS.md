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
