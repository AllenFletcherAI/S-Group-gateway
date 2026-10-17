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

## Active Path Under Modification (Slice 1: Layout & Navigation)
- **Current Task:** Portal Layout & Navigation Header Request Trace
- **Path Steps:**
  1. `HTTP GET /portal` -> Handled by Fastify router in `src/server.ts`
  2. Routed to `portalRoutes` in `src/routes/portal.ts`
  3. Language parameter evaluated (`lang=de` or `lang=en`)
  4. Template rendered via `renderLayout()` in `src/views/layout.ts`
  5. S-Group brand tokens injected from `src/config/branding.ts`
  6. Static assets (CSS/JS) served via `@fastify/static` from `src/public/css/layout.css` and `src/public/js/navigation.js`
  7. Client browser renders high-contrast, responsive header with tenant chip `DE-SIS-8921` and DSGVO badges.

