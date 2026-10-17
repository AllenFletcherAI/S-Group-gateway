# Threat Model & Abuse Scenarios

> List who could behave badly and what they could do (Habit 18).
> An admitted gap beats a hidden one. Probe with Strix Security.
> System: S-Group Gateway (Schäfer & SIS Interlogistik) • Classification: Lane B

## Threat Actor Taxonomy (The 5 Attackers)
1. **The Stranger on the Internet:** Public internet visitor attempting credential brute-forcing, spamming public routes, or path traversal.
2. **The Sneaky Logged-in Customer:** Registered tenant trying to change shipment IDs or document IDs in the URL to view competitor manifests or pricing (IDOR/BOLA).
3. **The Poisoned Package:** A compromised npm dependency attempting to exfiltrate database records or environment secrets.
4. **The Fake Partner Message:** An attacker forging DHL, DB Schenker, or Maersk webhooks to inject false customs clearances or shipment delays.
5. **The Rogue Insider / Disgruntled Staff:** Attempts to tamper directly with shipment records or bypass audit trails.

## Entry Point Analysis Table
| Door / Endpoint | Attacker | Worst Realistic Abuse | The Lock Stopping Them | Admitted Known Gap | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST /api/v1/webhooks/carrier` | Fake Partner / Stranger | Forging status updates ("Delivered" or "Customs Hold") to disrupt supply chains | Cryptographic HMAC-SHA256 signature verification with `crypto.timingSafeEqual` + 5-minute sliding timestamp window | Shared secrets stored in environment config; rotation requires updating carrier configs | Active (Verified) |
| `GET /api/v1/shipments/:id` | Sneaky Customer | Viewing competitor cargo manifests, weight, or pricing (IDOR) | Mandatory query partitioning: `ShipmentRepository.getShipmentDetails(tenantId, shipmentId)` returns 404 if tenant does not match | Single-tenant demo key currently defaults to `DE-SIS-8921` when unauthenticated | Active (Verified) |
| `GET /api/v1/documents/:id/download` | Sneaky Customer | Downloading competitor customs declarations (ATLAS/CMR) | Query strictly joins tenant's shipments before issuing verification receipt | Static file downloads return signed JSON metadata rather than raw binary PDFs in mock mode | Active (Verified) |
| `POST /api/v1/webhooks/carrier` (Malformed Body) | Stranger / Bot | Sending corrupted or oversized JSON payloads to crash Fastify | Strict Zod schema compilation (`DhlWebhookSchema`, `SchenkerWebhookSchema`, `MaerskWebhookSchema`) rejects malformed bodies with HTTP 400 | Max payload size enforced by Fastify default (1MB) | Active (Verified) |
| Application Logging | Rogue Insider | Inspecting server logs to harvest customer personal info (DSGVO violation) | Fastify logger redaction on auth headers; log messages strictly omit customer names, phone numbers, and raw IPs | System console logs require log shipping to an immutable, access-controlled SIEM | Active (Verified) |

## Strix Security Audit Receipt
- **Tool:** Strix Security (`defend-what-you-ship-suite_strix-security`)
- **Targets Scanned:** `src/routes/webhooks.ts`, `src/routes/api.ts`, `src/middleware/webhookAuth.ts`
- **Probe Type:** `all` (SQLi, IDOR, Auth Bypass, Path Traversal, ReDoS, Command Injection, Secrets)
- **Result:** **0 Static Vulnerabilities Found.** No hardcoded secrets, no unparameterized queries, no command injection vectors detected.

