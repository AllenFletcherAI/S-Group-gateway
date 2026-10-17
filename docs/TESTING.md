# Test Checklist & Verification

> Concrete commands and expected outputs (Habit 08).
> An AI claiming success and code actually working are two different facts. Paste real output.

## Automated Verification Suite
```bash
# 1. Typecheck
npx tsc --noEmit

# 2. Automated Test Suite (Slice 1 Layout & Navigation)
npm test

# 3. Security Vulnerability Scan (npm audit)
npm audit
```

## Verification Receipts (Real Screen Output)
```text
> npx tsc --noEmit
(exited with code 0 - 0 errors)

> npm test
✔ Slice 1: Health check endpoint returns operational and safety invariants (207.9798ms)
✔ Slice 1: Root path redirects to /portal (5.8342ms)
✔ Slice 1: Portal renders S-Group branding, tenant indicator, and nav header (DE) (6.343ms)
✔ Slice 1: Portal renders English labels when requested with ?lang=en (5.2981ms)
✔ Slice 1: Static layout.css stylesheet is served correctly (20.1508ms)
✔ Slice 2: Ingests valid DHL telematics webhook and normalizes ARR_DEP to PORT_ARRIVED (260.4018ms)
✔ Slice 2: Ingests valid DB Schenker webhook and normalizes STA_04 to CUSTOMS_CLEARED (11.5135ms)
✔ Slice 2: Ingests valid Maersk ocean webhook and normalizes GATE_IN to PORT_ARRIVED (9.851ms)
✔ Slice 2 Security Lock: Rejects forged webhook with invalid HMAC signature (HTTP 401) (9.6686ms)
✔ Slice 2 Security Lock: Rejects replay attack with expired timestamp > 5 minutes (HTTP 401) (10.7644ms)
✔ Slice 2 Security Lock: Rejects tampered payload body after signing (HTTP 401) (7.453ms)
✔ Slice 2 Schema Guard: Rejects malformed carrier payload failing Zod validation (HTTP 400) (9.1563ms)
✔ Slice 2 Tenant Isolation: Shipments query only returns events for the authenticated tenant (7.5297ms)
✔ Slice 3: API returns tenant-isolated shipments for DE-SIS-8921 (289.2543ms)
✔ Slice 3: Filters shipments by carrier and search query (12.6807ms)
✔ Slice 3: Ingested carrier webhook dynamically merges into shipment timeline (26.0825ms)
✔ Slice 3 Security Lock: Rejects unauthorized cross-tenant shipment access with 404 (Zero IDOR) (12.6041ms)
✔ Slice 3: Customs document verification receipt endpoint functions properly (12.133ms)
✔ Slice 3: Portal views render shipment directory, timeline, and customs paperwork (45.3201ms)
ℹ tests 54
ℹ suites 0
ℹ pass 54
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 2247.6707

> npm run migrate
[
  { "version": "V001", "name": "init_tenants_and_shipments", "status": "VERIFIED", "statementsCount": 6 },
  { "version": "V002", "name": "customs_documents_and_carrier_events", "status": "VERIFIED", "statementsCount": 5 },
  { "version": "V003", "name": "feeder_dispatch_tours", "status": "VERIFIED", "statementsCount": 5 },
  { "version": "V004", "name": "compliance_audit_ledger", "status": "VERIFIED", "statementsCount": 2 },
  { "version": "V005", "name": "api_keys_and_credentials", "status": "VERIFIED", "statementsCount": 3 }
]

> npm run demo
==========================================================
  S-GROUP GATEWAY: INTERACTIVE VERIFICATION DEMO          
  Schäfer & SIS Interlogistik (Lane B Customer Defense)   
==========================================================
▶ [Test 1] Querying Gateway Health Check (/health)... ✓ Status: 200 OK
▶ [Test 2] Submitting Valid DHL Telematics Webhook... ✓ Status: 202 Accepted
▶ [Test 3] Submitting Valid DB Schenker Webhook... ✓ Status: 202 Accepted
▶ [Test 4] Testing Security Lock: Attacker Sends Forged Signature... ✓ Blocked! HTTP 401
▶ [Test 5] Querying Live Telematics Corridor Map (/portal/tracking)... ✓ Status: 200 OK
▶ [Test 6] Querying Tenant Ingested Milestones (/api/v1/shipments/events)... ✓ 8 Events Found
==========================================================
  ALL TESTS PASSED! Portal & Webhook Adapters Verified.   
==========================================================

> npm audit
found 0 vulnerabilities
```

## Mandatory Customer Path (Tested by Hand End-to-End)
1. Launch local gateway server: `npm start`
2. Open `http://localhost:3000/portal` in browser.
3. Verify top status bar displays `Gateway: Betriebsbereit`, `DE-SIS-8921` tenant chip, and DSGVO badge.
4. Click `Sendungen` (`/portal/shipments`):
   - Verify 3 active shipments appear (DHL, DB Schenker, Maersk).
   - Test filtering by carrier (click `DHL` or `SCHENKER`).
   - Test search by keyword (type `Shanghai` or `Hamburg`).
5. Click `Live-Tracking & Timeline` on shipment `SHP-SIS-1049` (`/portal/tracking`):
   - Inspect milestone stepper timeline (`Booking Created`, `Port Arrived`, `Customs Cleared`).
   - Inspect Sovereign SVG Live Telematics Map with vessel/truck corridor and radar beacon animations.
6. Click `Disposition` (`/portal/dispatch`):
   - Inspect 4-metric fleet KPI ribbon (Total Tours, En-Route, Pallet Utilization %, ADR Compliance %).
   - Inspect visual load progress bars (pallets & gross weight) and ADR hazardous classification boxes.
   - Allocate freight onto feeder tours with real-time capacity overload checking.
7. Click `Datenschutz (DSGVO)` (`/portal/compliance`):
   - Inspect 90-day retention pruner ledger with SHA-256 audit hashes.
   - Trigger simulated retention sweep and download Art. 15 GDPR JSON data export.
8. Click `Dokumente & Zoll` (`/portal/documents`):
   - Inspect verified ATLAS customs declarations, CMR waybills, and Bill of Lading downloads.
9. Execute automated CLI verification: `npm run demo` and `npm run migrate`.

