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

## Active Path Under Modification (Slice 3: Unified Shipment Status & Timeline)
- **Current Task:** Customer Live Tracking & Milestone Timeline Rendering
- **Path Steps:**
  1. `HTTP GET /portal/tracking?id=SHP-SIS-1049` (or `GET /api/v1/shipments/SHP-SIS-1049`)
  2. Authenticated tenant context extracted (`DE-SIS-8921`) from session/headers.
  3. Repository Query: Calls `ShipmentRepository.getShipmentDetails(tenantId, shipmentId)` in `src/repositories/shipments.ts`.
     - Strictly queries `WHERE tenant_id = :tenantId`. Rejects cross-tenant access with 404 (IDOR lock).
     - Fetches baseline dispatch event (`BOOKING_CREATED`).
     - Queries ingested carrier telematics (`getIngestedEvents()`) matching `carrierReference` or `shipmentId`.
     - Merges milestones chronologically into an immutable timeline array.
  4. View / Serializer:
     - `src/views/tracking.ts` renders responsive stepper timeline cards with date/time, milestone badges, location tags, and source tags (`CARRIER_TELEMATICS`).
     - Displays verified customs documents (`ATLAS Zollanmeldung`, `CMR-Frachtbrief`) with verification links (`/api/v1/documents/:id/download`).
  5. Response: Client browser renders interactive timeline with high-contrast WCAG AA styling.



