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

