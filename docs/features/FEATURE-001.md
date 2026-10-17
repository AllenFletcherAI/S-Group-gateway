# FEATURE-001: S-Group Gateway Core Platform (Schäfer & SIS Interlogistik)

> Requirements Blueprint & Specification (Step 1 Blueprint & Habit 05)
> Project Classification: Lane B (Customer-Facing / Real Business)

---

## 1. Executive Summary & Goal
Build a secure, modular API Gateway and Customer Tracking Portal for Schäfer & SIS Interlogistik. 
The system connects enterprise shipping customers with carrier telematics, standardizes heterogeneous logistics data, and enforces strict German privacy (DSGVO) and customer isolation boundaries.

---

## 2. The 3 Core Deliverables

### Deliverable 1: Branded Customer Freight & Tracking Portal
- **What it does:** Responsive, accessible web interface branded with official Schäfer & SIS Interlogistik design tokens and typography.
- **Key capabilities:**
  - Secure customer login (JWT session authentication).
  - Search and filter active shipments by reference number, container ID, or booking date.
  - Interactive milestone timeline (e.g. Booking Created -> Port Arrival -> Customs Cleared -> Out for Delivery -> Delivered).
  - Download verified shipping documents and customs declarations.

### Deliverable 2: EDI / REST Carrier Protocol Adapter
- **What it does:** Translation layer that ingests external carrier telematics, status webhooks, and EDI/CSV files, converting them into standardized S-Group Gateway JSON records.
- **Key capabilities:**
  - Webhook listener verifying HMAC-SHA256 cryptographic signatures and timestamp freshness (< 5 minutes).
  - Normalization engine mapping diverse carrier event codes (e.g., DHL "ARR_DEP", DB Schenker "STA_04") into unified S-Group event enums.
  - Schema validation pipeline using Zod before any payload touches internal business services.

### Deliverable 3: Unified Shipment Status & Dispatch API
- **What it does:** High-performance, modular internal API for tracking queries, dispatch operations, and enterprise partner integrations.
- **Key capabilities:**
  - Multi-tenant querying strictly partitioned by `tenant_id`.
  - Event-driven status updates with audit trail.
  - Rate-limited public API endpoints for enterprise ERP integration.

---

## 3. Technology Stack & Architecture
- **Runtime:** Node.js / TypeScript
- **Framework:** Modular service architecture (Fastify / Express with clean boundary separation)
- **Data Validation:** Zod (strict compile-time and runtime boundary validation)
- **Persistence:** PostgreSQL (ACID relational storage for shipments, events, and audit logs)
- **Security & Auth:**
  - Customer / Dispatcher: Bearer JWT & scoped API keys
  - Carrier Webhooks: HMAC-SHA256 shared secret with replay protection

---

## 4. The 4 Safety Rules & Rationale (Educated Defense)

### Rule 1: Strict Tenant Isolation (Zero IDOR / BOLA)
- **Plain Rationale:** In a shared logistics platform, Customer A (e.g. BMW) must never see Customer B's (e.g. Siemens) freight, pricing, or destination.
- **Lock:** Every SQL query and API handler enforces `WHERE tenant_id = :current_tenant_id`. No raw ID lookups without tenant scoping.

### Rule 2: German DSGVO / GDPR Log Sanitization
- **Plain Rationale:** Storing customer names, phone numbers, personal delivery addresses, or IP addresses in plain server logs violates European and German privacy laws (DSGVO Art. 5/32).
- **Lock:** Automated log filter masks IP addresses and strips PII before writing to disk or telemetry. Only operational identifiers (`shipment_id`, `carrier_code`) are logged.

### Rule 3: 90-Day Telematics Retention & Anonymization
- **Plain Rationale:** Indefinite tracking of driver GPS locations violates German employee privacy and Betriebsrat regulations.
- **Lock:** High-frequency GPS coordinates are pruned 90 days after delivery confirmation, retaining only macro-milestone timestamps.

### Rule 4: Cryptographic Webhook Verification (HMAC-SHA256)
- **Plain Rationale:** Without signatures, attackers can inject fake delivery statuses or disrupt logistics pipelines.
- **Lock:** Webhook payloads must contain a valid HMAC-SHA256 signature matching the carrier shared secret and a timestamp within a 5-minute sliding window.

---

## 5. Scope Boundaries

### Included in Phase 1:
- [x] S-Group Gateway architecture specification and safety invariants.
- [x] Modular directory layout for routes, adapters, domain services, and repository layers.
- [x] Ingestion schema definitions and Zod validation schemas.
- [x] Multi-tenant database migrations for Shipments, Milestone Events, and Tenants.
- [x] Branded UI layout conforming to S-Group visual standards.

### Excluded for Later Phases:
- Automated real-time payment gateway (invoicing remains handled via existing ERP billing).
- Native iOS/Android mobile apps (responsive mobile web portal satisfies Phase 1).
- Multi-region geo-distributed database clustering (single PostgreSQL primary with read-replica suffices for current volume).

---

## 6. Assumptions Audit (Habit 21)
- [x] **Verified:** German DSGVO compliance is legally mandatory for customer and driver data.
- [x] **Verified:** Bearer JWT and HMAC-SHA256 provide sufficient security for API clients and carrier integrations.
- [ ] **Unverified (Need verification):** Exact carrier EDI standard formats (EDIFACT IFTSTA vs custom JSON webhooks) per carrier.
- [ ] **Unverified (Need verification):** S-Group primary brand color hex codes and typography font assets.
