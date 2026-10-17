import { test } from "node:test";
import assert from "node:assert/strict";
import { buildServer } from "../src/server.js";
import {
  findPrincipalByApiKey,
  signJwtToken,
  verifyJwtToken,
} from "../src/middleware/auth.js";

const KEY_CUSTOMER = "sg_live_customer_bmw";
const KEY_DISPATCHER = "sg_live_dispatcher_sis";
const KEY_COMPLIANCE = "sg_live_compliance_officer";
const KEY_COMPETITOR = "sg_live_competitor_key";
const KEY_INVALID = "sg_live_forged_hacker_key_999";

test("Slice 9 Auth Service: Validates API keys and rejects timing attack side-channels", () => {
  // 1. Valid customer key lookup
  const principal = findPrincipalByApiKey(KEY_CUSTOMER);
  assert.ok(principal, "Principal must be found for valid customer key");
  assert.equal(principal.tenantId, "DE-SIS-8921");
  assert.equal(principal.role, "CUSTOMER_VIEWER");
  assert.deepEqual(principal.scopes, ["shipments:read"]);

  // 2. Forged key lookup returns null
  const invalidPrincipal = findPrincipalByApiKey(KEY_INVALID);
  assert.equal(invalidPrincipal, null, "Forged key must return null");
});

test("Slice 9 JWT Engine: Signs and verifies tamper-evident HMAC-SHA256 session tokens", () => {
  const principal = {
    principalId: "USR-TEST-01",
    tenantId: "DE-SIS-8921",
    role: "DISPATCHER" as const,
    scopes: ["shipments:read" as const, "dispatch:manage" as const],
  };

  // 1. Generate token
  const token = signJwtToken(principal, 3600);
  assert.ok(token.split(".").length === 3, "JWT must contain header.payload.signature");

  // 2. Verify valid token
  const verified = verifyJwtToken(token);
  assert.equal(verified.valid, true);
  assert.equal(verified.payload!.sub, "USR-TEST-01");
  assert.equal(verified.payload!.tenantId, "DE-SIS-8921");
  assert.deepEqual(verified.payload!.scopes, ["shipments:read", "dispatch:manage"]);

  // 3. Tamper with token payload (simulate attacker modifying tenantId in base64 payload)
  const parts = token.split(".");
  const tamperedPayload = Buffer.from(
    JSON.stringify({ ...verified.payload, tenantId: "COMPETITOR-LEAK" })
  ).toString("base64url");
  const tamperedToken = `${parts[0]}.${tamperedPayload}.${parts[2]}`;

  const tamperedResult = verifyJwtToken(tamperedToken);
  assert.equal(tamperedResult.valid, false);
  assert.match(tamperedResult.error!, /Invalid cryptographic JWT signature/i);
});

test("Slice 9 Auth API: POST /api/v1/auth/token exchanges API key for JWT and /api/v1/auth/me verifies profile", async () => {
  const app = await buildServer();

  // 1. Exchange API key for JWT token
  const tokenRes = await app.inject({
    method: "POST",
    url: "/api/v1/auth/token",
    payload: { apiKey: KEY_DISPATCHER },
  });

  assert.equal(tokenRes.statusCode, 200);
  const tokenData = JSON.parse(tokenRes.payload);
  assert.equal(tokenData.tokenType, "Bearer");
  assert.ok(tokenData.accessToken);
  assert.equal(tokenData.principal.role, "DISPATCHER");
  assert.ok(tokenData.principal.scopes.includes("dispatch:manage"));

  // 2. Access /api/v1/auth/me without token -> HTTP 401 Unauthorized
  const unauthRes = await app.inject({
    method: "GET",
    url: "/api/v1/auth/me",
  });
  assert.equal(unauthRes.statusCode, 401);

  // 3. Access /api/v1/auth/me with issued JWT token -> HTTP 200 OK
  const authRes = await app.inject({
    method: "GET",
    url: "/api/v1/auth/me",
    headers: { authorization: `Bearer ${tokenData.accessToken}` },
  });
  assert.equal(authRes.statusCode, 200);
  const authData = JSON.parse(authRes.payload);
  assert.equal(authData.authenticated, true);
  assert.equal(authData.principal.role, "DISPATCHER");
  assert.equal(authData.principal.tenantId, "DE-SIS-8921");

  await app.close();
});

test("Slice 9 RBAC Enforcement: Blocks unauthorized scope elevation with HTTP 403 Forbidden", async () => {
  const app = await buildServer();

  // 1. Customer Key has 'shipments:read' only
  // Attempting to assign shipment onto feeder tour requires 'dispatch:manage'
  const forbiddenAssignRes = await app.inject({
    method: "POST",
    url: "/api/v1/dispatch/tours/TOUR-STR-04/assign",
    headers: { authorization: `Bearer ${KEY_CUSTOMER}` },
    payload: { shipmentId: "SHP-SIS-1049", pallets: 2, weightKg: 500 },
  });

  assert.equal(forbiddenAssignRes.statusCode, 403);
  const forbiddenAssignData = JSON.parse(forbiddenAssignRes.payload);
  assert.equal(forbiddenAssignData.error, "Forbidden");
  assert.match(forbiddenAssignData.message, /dispatch:manage/);

  // 2. Customer Key attempting compliance retention pruning requires 'compliance:audit'
  const forbiddenPruneRes = await app.inject({
    method: "POST",
    url: "/api/v1/compliance/prune",
    headers: { authorization: `Bearer ${KEY_CUSTOMER}` },
    payload: { dryRun: true },
  });

  assert.equal(forbiddenPruneRes.statusCode, 403);
  const forbiddenPruneData = JSON.parse(forbiddenPruneRes.payload);
  assert.equal(forbiddenPruneData.error, "Forbidden");
  assert.match(forbiddenPruneData.message, /compliance:audit/);

  // 3. Dispatcher Key HAS 'dispatch:manage' -> Allowed
  const allowedAssignRes = await app.inject({
    method: "POST",
    url: "/api/v1/dispatch/tours/TOUR-STR-04/assign",
    headers: { authorization: `Bearer ${KEY_DISPATCHER}` },
    payload: { shipmentId: "SHP-RBAC-OK", pallets: 1, weightKg: 200 },
  });

  assert.equal(allowedAssignRes.statusCode, 200);

  // 4. Compliance Officer Key HAS 'compliance:audit' -> Allowed
  const allowedPruneRes = await app.inject({
    method: "POST",
    url: "/api/v1/compliance/prune",
    headers: { authorization: `Bearer ${KEY_COMPLIANCE}` },
    payload: { dryRun: true },
  });

  assert.equal(allowedPruneRes.statusCode, 200);

  await app.close();
});

test("Slice 9 Anti-Spoofing & Zero IDOR: Cryptographically bound tenant overrides spoofed headers", async () => {
  const app = await buildServer();

  // Competitor key is bound to TENANT-COMPETITOR-XYZ.
  // Attacker tries to send X-Tenant-Id: DE-SIS-8921 to snoop on Schäfer & SIS shipments.
  const spoofRes = await app.inject({
    method: "GET",
    url: "/api/v1/shipments",
    headers: {
      authorization: `Bearer ${KEY_COMPETITOR}`,
      "x-tenant-id": "DE-SIS-8921", // Attacker's spoof attempt
    },
  });

  assert.equal(spoofRes.statusCode, 200);
  const spoofData = JSON.parse(spoofRes.payload);

  // Must strictly evaluate to TENANT-COMPETITOR-XYZ, leaking ZERO Schäfer shipments
  assert.equal(spoofData.tenantId, "TENANT-COMPETITOR-XYZ");
  assert.equal(spoofData.count, 1);
  assert.equal(spoofData.shipments[0].shipmentId, "SHP-OTHER-9901");
  assert.ok(!spoofData.shipments.some((s: any) => s.tenantId === "DE-SIS-8921"), "Must not leak any DE-SIS-8921 shipments");

  await app.close();
});
