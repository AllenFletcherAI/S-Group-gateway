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

## Decision D-011: Customs Pre-Clearance Redline Audit & 3-Way Reconciliation Engine
- **Option 1: Manual Visual Inspection of Paper/PDF Documents by Dispatchers**
  - *Cost / Risk:* High labor cost, slow turnarounds, high human error rate leading to container detention fees (€150–€500/day), missed discrepancies between ATLAS declarations and carrier waybills, and uncoordinated port gate-in rejections.
  - *Why rejected:* Fails to prevent demurrage penalties before trucks reach seaport gates and does not provide cryptographic audit trails.
- **Option 2: Heavy Third-Party Cloud Customs SaaS with US Data Relays**
  - *Cost / Risk:* Recurring per-document licensing fees, vendor lock-in, latency dependencies on outside APIs, and violation of German DSGVO (GDPR) data sovereignty when transferring freight commercial invoice data to foreign servers.
  - *Why rejected:* Breaches Lane B privacy rules, adds unneeded external failure points, and incurs recurring operational costs.
- **Option 3: Deterministic 3-Way Reconciliation & ISO 6346 Modulo-11 Audit Engine Ported from RedLine Gateway (Chosen)**
  - *Cost / Risk:* Requires maintaining TypeScript domain reconciliation rules and sample verification fixtures.
  - *Why chosen:* Directly reuses battle-tested German forwarding and customs logic: pure ISO 6346 container check digit calculation, § 412 HGB 50 kg / 1% tare weight tolerance checking, package count matching, and automatic generation of formal ADSp 2017 Speditions-Beanstandung notices. Adheres strictly to Hick's Law with zero external dependencies and sub-5ms local execution.

## Decision D-012: Dark Mode & Light Mode Theme Engine with Anti-FOUC Instant Toggle
- **Option 1: Cookie-Based Server-Side Theme Rendering**
  - *Cost / Risk:* Requires an HTTP POST or query-parameter change on toggle, forcing full page reloads, causing white page flashing, and increasing server request volume on every cosmetic preference switch.
  - *Why rejected:* Degrades UX with reload latency and screen flicker; unnecessary for client-side display preferences.
- **Option 2: Heavy External Theme Framework / CSS-in-JS Runtime Library**
  - *Cost / Risk:* Adds 30KB+ to frontend bundle size, introduces external runtime dependencies, slows down page parsing, and risks third-party bundle vulnerabilities.
  - *Why rejected:* Violates lightweight sovereign frontend discipline; native CSS variables solve this natively in < 2KB.
- **Option 3: Native CSS Custom Properties with Synchronous Inline Anti-FOUC Script and Client LocalStorage Persistence (Chosen)**
  - *Cost / Risk:* Requires defining paired light/dark color variables across all UI components.
  - *Why chosen:* Executes instantaneously in the browser, prevents Flash of Unstyled Content (FOUC) with a tiny synchronous `<head>` script, auto-adapts to OS preferences (`prefers-color-scheme`), persists in `localStorage`, and provides WCAG AA contrast for both night-shift dispatch control rooms and daylight office desks.

## Decision D-013: Persistent Multi-Language Session Routing & Zero-Bounce Tab Navigation
- **Option 1: Heavy SPA Framework Client Router (React Router / Vue Router)**
  - *Cost / Risk:* Requires full client-side SPA re-architecture, introduces bundle bloat, compromises server-side rendered HTML security, and complicates air-gapped container testing.
  - *Why rejected:* Excessive architectural complexity for simple tab navigation language preservation.
- **Option 2: Client-Side-Only DOM Language Replacement via JavaScript JSON Dictionaries**
  - *Cost / Risk:* Slow client rendering, translation flicker on page load, incomplete translation of server-generated dynamic error messages and legal memos (ADSp 2017).
  - *Why rejected:* Breaks server-side generation of legal customs texts and requires duplicating all translation strings into client memory.
- **Option 3: Dual-Layer Session Cookie Persistence with Query-Param Inheritance & No-Op Active Guards (Chosen)**
  - *Cost / Risk:* Requires server cookie check helper and propagating `lang` in layout navigation link generation.
  - *Why chosen:* Transparently maintains the user's selected language across all tab transitions, direct links, and reloads via HTTP cookies (`sgroup_lang`) without resetting. Eliminates redundant page refreshes when clicking an already active language button.

## Decision D-014: Operational Assembly Line Pipeline Reorganization & RedLine Feature Harmonization
- **Option 1: Keep brochure website layout and add modal popups to existing pages**
  - *Cost / Risk:* Operators must jump across 6 separate disconnected pages; high mental friction; no clear sequential progression matching freight container arrival.
  - *Why rejected:* Fails fast-paced logistics operations where customs, demurrage, and dispatch are sequential steps.
- **Option 2: Create two separate web applications (one for tracking, one for customs audit)**
  - *Cost / Risk:* High maintenance burden; dual deployment pipelines; disjointed authentication and tenant context.
  - *Why rejected:* Unnecessary architectural fracture for what should be a single operational gateway.
- **Option 3: 5-Tab Sequential Operational Assembly Line with Clickable Header KPI Ribbon (Chosen)**
  - *Cost / Risk:* Requires reorganizing view templates and route aliases.
  - *Why chosen:* Directly mirrors the physical freight lifecycle (Audit -> Reconcile -> Quarantine -> Dispatch -> Ledger), unifies RedLine's proven tooling, and provides 1-click global status shortcuts.

## Decision D-015: Two-Tier Fixed 100vh Cockpit Standard, Proportional Auto-Fit Engine & Dismissible Flow
- **Option 1: Retain marketing footer, outer page scrollbars, and unconstrained image views**
  - *Cost / Risk:* Double-scrolling friction; 1200px image blowouts hiding action buttons; wasted screen space for operators on multi-monitor desk setups.
  - *Why rejected:* Breaches industrial desktop ergonomics standards.
- **Option 2: Heavy third-party Canvas/PDF viewer library**
  - *Cost / Risk:* Adds 500KB+ client JS bundle, slow initialization, breaks air-gapped performance.
  - *Why rejected:* Violates lightweight sovereign frontend discipline.
- **Option 3: Fixed 100vh Two-Tier Cockpit with Native Proportional Auto-Fit and Dismissible Intake (Chosen)**
  - *Cost / Risk:* Requires careful flexbox layout configuration and client resize listeners.
  - *Why chosen:* Zero external JS bundle; eliminates outer scrollbars; auto-fits documents with zero blowout; includes F1 operator cheat sheet.

## Decision D-016: 100% Full-Width Layout Harmonization, State Desync Resolution & Icon Standardization
- **Option 1: Quick inline CSS patches and opacity toggles**
  - *Cost / Risk:* Fragile layout shifts; dead black voids remain on wide screens; state contradictions remain in DOM.
  - *Why rejected:* Unprofessional and fails Lane B quality bar.
- **Option 2: Complete stylesheet rewrite**
  - *Cost / Risk:* High regression risk across 14 existing test suites.
  - *Why rejected:* High risk of breaking working components.
- **Option 3: Targeted Flexbox Direction Standardization, Bidirectional State Sync, and FontAwesome Icons (Chosen)**
  - *Cost / Risk:* Requires editing view markup and stylesheet alignment.
  - *Why chosen:* Eradicates widescreen dead void; syncs idle vs. active document states; removes emoji clutter; provides 100% clean English and German localization.

## Decision D-017: Elimination of Mock Theater & Transition to Operational SQLite Ledger and Live Ingestion
- **Option 1: Retain frontend mock timers (`setTimeout`) and static hardcoded table rows**
  - *Cost / Risk:* Complete failure of credibility; non-functional file upload; fake database ping alerts; zero data persistence across reloads.
  - *Why rejected:* Mockup theater unacceptable for customer-facing Lane B software.
- **Option 2: External cloud database and external SaaS OCR provider**
  - *Cost / Risk:* High latency, per-document SaaS costs, vendor lock-in, and transfer of confidential freight invoices outside sovereign boundaries (violating German DSGVO).
  - *Why rejected:* Violates data sovereignty and adds recurring operational costs.
- **Option 3: Embedded Native `node:sqlite` ACID Ledger with Dual-Mode Extractor and Real Multipart APIs (Chosen)**
  - *Cost / Risk:* Requires maintaining schema DDL and SQLite query helpers.
  - *Why chosen:* Zero mock theater: real cryptographic SHA-256 computation, real Modulo-11 check digit verification, real ADSp 2017 tare tolerance checking, high-throughput ACID persistence in `data/sgroup_gateway.db` with WAL mode, test runner isolation via `:memory:`, working multipart file intake, real supervisor override endpoints, live database latency probes, and streaming CSV downloads.






