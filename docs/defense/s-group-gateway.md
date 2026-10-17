# WHITEBOARD DEFENSE: S-Group Gateway (Schäfer & SIS Interlogistik)

> 1-Page Whiteboard Defense Brief (Habit 16 & Whiteboard Defense Benchmark).
> If you can explain this single page in plain words to a client or auditor without notes, you pass the benchmark.

---

### 1. What It Does (In 2 Plain Sentences)
The S-Group Gateway connects enterprise cargo customers with real-time shipment tracking, milestone timelines, and verified customs paperwork for Schäfer & SIS Interlogistik. 
It ingests and standardizes heterogeneous telematics webhooks from carriers (DHL, DB Schenker, Maersk) while strictly enforcing German privacy laws (DSGVO) and customer data isolation.

---

### 2. How It Works (The Data Path)
```text
[External Carrier / Customer Browser]
       │
       ▼
1. Front Door (Fastify HTTP Edge) 
       │  • Strips/redacts sensitive headers (DSGVO Art. 32)
       │  • Serves high-contrast S-Group branded UI (/portal)
       ▼
2. Cryptographic Security Guard (webhookAuth.ts)
       │  • Computes HMAC-SHA256 signature with constant-time equality (timingSafeEqual)
       │  • Rejects replay attacks older than 300 seconds (5 minutes) with HTTP 401
       ▼
3. Normalization Engine (carrierAdapter.ts & carrierEvents.ts)
       │  • Zod boundary schemas parse raw carrier JSON payloads
       │  • Maps proprietary codes (DHL ARR_DEP, Schenker STA_04, Maersk GATE_IN) to Unified Milestones
       ▼
4. Multi-Tenant Repository (shipments.ts)
       │  • Strictly filters: WHERE tenant_id = :authenticated_tenant_id (Zero IDOR / BOLA)
       │  • Chronologically merges initial dispatch with live carrier milestone events
       ▼
5. Customer Screen (tracking.ts & layout.ts)
          Renders interactive stepper timeline, status pills, and verified customs downloads
```

---

### 3. Key Choices & Why We Chose Them Over Alternatives
1. **Modular TypeScript & Fastify (D-001):**
   * *Rejected:* Giant 300KB single-file script (fails maintainability) and Go microservices (premature complexity).
   * *Why Chosen:* Low-overhead HTTP routing, clean plugin architecture, and compile-time boundary safety.
2. **HMAC-SHA256 Signatures with 5-Minute Replay Window (D-002):**
   * *Rejected:* URL query tokens (leak in reverse-proxy logs) and mTLS (fragile certificate rotations for carriers).
   * *Why Chosen:* Cryptographically verifies sender identity and payload integrity without infrastructure friction.
3. **Query-Layer Tenant Partitioning (D-003):**
   * *Rejected:* Direct carrier proxying (freezes UI during carrier downtime) and browser-side filtering (critical IDOR leak).
   * *Why Chosen:* Enforces database-level isolation so Customer A can never view Customer B's cargo or bills.

---

### 4. How Information Is Kept (Data Records)
* **Shipment Model:** UUID/Reference, `tenantId` (partition key), Carrier, Origin, Destination, Weight, Status, Customs Documents.
* **Milestone Events:** Append-only log of verified carrier signals (`eventId`, `milestone`, `timestamp`, `location`, `source`).
* **DSGVO Data Retention:** High-frequency telematics GPS coordinates are pruned after 90 days (Art. 5 DSGVO). Only macro-milestones remain in long-term archive.

---

### 5. The 5 Attackers & How Our Locks Stop Them
1. **The Stranger on the Internet:** Blocked from modifying data; public endpoints accept only signed webhooks or read-only public status.
2. **The Sneaky Logged-in Customer:** IDOR attempts (altering `shipmentId` or `docId` in the URL) return HTTP 404 because all queries join `WHERE tenant_id = :current_tenant_id`.
3. **The Fake Partner Message:** Forged webhooks lacking valid HMAC-SHA256 signatures are dropped immediately with HTTP 401. Replays older than 5 minutes fail timestamp checks.
4. **The Poisoned Package:** `npm audit` shows 0 vulnerabilities; runtime input parsing is strictly sandboxed via Zod.
5. **The Rogue Insider:** Server logs automatically redact authentication tokens; customer PII (names, phone numbers, IPs) is masked before logging.

---

### 6. Where It Hits Limits & How We Notice (Breakdown Points)
* **Traffic Limit:** 500 concurrent connections per Node.js worker before event loop latency rises above 50ms.
* **Payload Limit:** 1MB maximum webhook request body enforced at the HTTP gateway.
* **Timeout Limit:** 5000ms hard server timeout on client queries.
* **Alarms:** P99 response time alert (>500ms), Webhook 4xx/5xx surge counter, and unverified signature spike alarm.

---

### 7. What We Would Improve With One More Week
* **Distributed Redis Cache:** Horizontal shared rate limiter and replay nonce cache across multiple server regions.
* **Real-Time WebSockets:** Live push updates for moving container ship and feeder truck coordinates on an interactive map.
