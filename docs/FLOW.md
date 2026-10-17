# Execution Flow & Request Traces

> Document how execution travels between files, functions, and modules (Habit 04).
> Sync with Graphify AST call graphs. Bugs live in the gaps between files.

## Primary Customer Request Trace
1. **Entry Point:**
   - `src/routes/... -> handlerName` (Receives HTTP request / CLI command)
2. **Authentication & Schema Guard:**
   - `src/middleware/... -> validateSession / validateSchema` (Verifies token and validates body)
3. **Domain Business Logic:**
   - `src/services/... -> executeOperation` (Applies core invariants and transforms)
4. **Data Persistence:**
   - `src/repositories/... -> saveEntity` (Persists state changes to database)
5. **Response Serializer:**
   - `src/serializers/... -> formatResponse` (Sanitizes egress payload and returns HTTP 200/201)

## Active Path Under Modification (Slice 2: Carrier Webhook Ingestion & Normalization)
- **Current Task:** Inbound Carrier Telematics Ingestion & Protocol Mapping
- **Path Steps:**
  1. `HTTP POST /api/v1/webhooks/carrier` with headers (`x-carrier-id`, `x-carrier-signature`, `x-carrier-timestamp`, `x-tenant-id`).
  2. Routed to `webhookRoutes` in `src/routes/webhooks.ts`.
  3. Header validation: Verifies `x-carrier-id` against `CarrierCodeEnum` (`DHL`, `SCHENKER`, `MAERSK`).
  4. Cryptographic Guard: Calls `verifyWebhookSignature()` in `src/middleware/webhookAuth.ts`.
     - Computes HMAC-SHA256(`timestamp.body`, `secret`).
     - Constant-time comparison (`crypto.timingSafeEqual`) defends against timing attacks.
     - Validates sliding timestamp window ($\le 300\text{s}$) to reject replay attacks.
  5. Protocol Normalization: Calls `normalizeCarrierEvent()` in `src/adapters/carrierAdapter.ts`.
     - Validates payload against carrier-specific Zod schema (`DhlWebhookSchema`, `SchenkerWebhookSchema`, `MaerskWebhookSchema`).
     - Translates raw carrier event codes (e.g. `ARR_DEP`, `STA_04`, `GATE_IN`) into unified `UnifiedMilestoneEnum`.
  6. Persistence / Event Store: Appends validated event to tenant-isolated store (`tenantId`).
  7. Response: Returns HTTP 202 Accepted with assigned `eventId` and unified `milestone`.


