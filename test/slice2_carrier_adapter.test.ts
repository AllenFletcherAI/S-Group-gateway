import test from "node:test";
import assert from "node:assert/strict";
import { buildServer } from "../src/server.js";
import { generateHmacSignature } from "../src/middleware/webhookAuth.js";
import { getCarrierSecret, clearIngestedEvents } from "../src/routes/webhooks.js";

/**
 * Automated Verification Suite for Slice 2: Carrier Webhook Ingestion & EDI Protocol Adapter
 * WHY: Proves cryptographic defense against forgery, replay attacks, and tampering,
 * and verifies event code normalization for DHL, DB Schenker, and Maersk (Habits 08, 18).
 */

test.beforeEach(() => {
  clearIngestedEvents();
});

test("Slice 2: Ingests valid DHL telematics webhook and normalizes ARR_DEP to PORT_ARRIVED", async () => {
  process.env.NODE_ENV = "test";
  const app = await buildServer();

  const dhlPayload = {
    trackingNumber: "DHL-DE-99281726",
    statusCode: "ARR_DEP",
    timestamp: new Date().toISOString(),
    facility: "Hamburg Waltershof Terminal",
    notes: "Container discharged onto rail siding"
  };

  const rawBody = JSON.stringify(dhlPayload);
  const timestamp = Date.now().toString();
  const secret = getCarrierSecret("DHL");
  const signature = generateHmacSignature(rawBody, timestamp, secret);

  const response = await app.inject({
    method: "POST",
    url: "/api/v1/webhooks/carrier",
    headers: {
      "content-type": "application/json",
      "x-carrier-id": "DHL",
      "x-carrier-timestamp": timestamp,
      "x-carrier-signature": signature,
      "x-tenant-id": "DE-SIS-8921"
    },
    payload: dhlPayload,
  });

  assert.equal(response.statusCode, 202);
  const result = JSON.parse(response.payload);
  assert.equal(result.status, "accepted");
  assert.equal(result.milestone, "PORT_ARRIVED");
  assert.equal(result.carrierReference, "DHL-DE-99281726");
  assert.ok(result.eventId);

  await app.close();
});

test("Slice 2: Ingests valid DB Schenker webhook and normalizes STA_04 to CUSTOMS_CLEARED", async () => {
  process.env.NODE_ENV = "test";
  const app = await buildServer();

  const schenkerPayload = {
    consignmentId: "SCH-FRA-441290",
    eventCode: "STA_04",
    eventDateTime: new Date().toISOString(),
    terminalName: "Frankfurt CargoCity South",
    remarks: "Zollabfertigung ATLAS erfolgreich abgeschlossen"
  };

  const rawBody = JSON.stringify(schenkerPayload);
  const timestamp = Date.now().toString();
  const secret = getCarrierSecret("SCHENKER");
  const signature = generateHmacSignature(rawBody, timestamp, secret);

  const response = await app.inject({
    method: "POST",
    url: "/api/v1/webhooks/carrier",
    headers: {
      "content-type": "application/json",
      "x-carrier-id": "SCHENKER",
      "x-carrier-timestamp": timestamp,
      "x-carrier-signature": signature,
      "x-tenant-id": "DE-SIS-8921"
    },
    payload: schenkerPayload,
  });

  assert.equal(response.statusCode, 202);
  const result = JSON.parse(response.payload);
  assert.equal(result.status, "accepted");
  assert.equal(result.milestone, "CUSTOMS_CLEARED");
  assert.equal(result.carrierReference, "SCH-FRA-441290");

  await app.close();
});

test("Slice 2: Ingests valid Maersk ocean webhook and normalizes GATE_IN to PORT_ARRIVED", async () => {
  process.env.NODE_ENV = "test";
  const app = await buildServer();

  const maerskPayload = {
    containerNumber: "MSKU8472910",
    eventType: "GATE_IN",
    recordedAt: new Date().toISOString(),
    portCode: "DEHAM",
    vesselName: "Maersk Mc-Kinney Moller"
  };

  const rawBody = JSON.stringify(maerskPayload);
  const timestamp = Date.now().toString();
  const secret = getCarrierSecret("MAERSK");
  const signature = generateHmacSignature(rawBody, timestamp, secret);

  const response = await app.inject({
    method: "POST",
    url: "/api/v1/webhooks/carrier",
    headers: {
      "content-type": "application/json",
      "x-carrier-id": "MAERSK",
      "x-carrier-timestamp": timestamp,
      "x-carrier-signature": signature,
      "x-tenant-id": "DE-SIS-8921"
    },
    payload: maerskPayload,
  });

  assert.equal(response.statusCode, 202);
  const result = JSON.parse(response.payload);
  assert.equal(result.status, "accepted");
  assert.equal(result.milestone, "PORT_ARRIVED");
  assert.equal(result.carrierReference, "MSKU8472910");

  await app.close();
});

test("Slice 2 Security Lock: Rejects forged webhook with invalid HMAC signature (HTTP 401)", async () => {
  process.env.NODE_ENV = "test";
  const app = await buildServer();

  const payload = {
    trackingNumber: "DHL-FORGED-001",
    statusCode: "DLV",
    timestamp: new Date().toISOString(),
    facility: "Unknown Attacker Terminal"
  };

  // Forged signature
  const fakeSignature = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
  const timestamp = Date.now().toString();

  const response = await app.inject({
    method: "POST",
    url: "/api/v1/webhooks/carrier",
    headers: {
      "content-type": "application/json",
      "x-carrier-id": "DHL",
      "x-carrier-timestamp": timestamp,
      "x-carrier-signature": fakeSignature,
    },
    payload,
  });

  assert.equal(response.statusCode, 401);
  const result = JSON.parse(response.payload);
  assert.equal(result.error, "Unauthorized");
  assert.match(result.reason, /signature mismatch/i);

  await app.close();
});

test("Slice 2 Security Lock: Rejects replay attack with expired timestamp > 5 minutes (HTTP 401)", async () => {
  process.env.NODE_ENV = "test";
  const app = await buildServer();

  const payload = {
    trackingNumber: "DHL-REPLAY-001",
    statusCode: "DLV",
    timestamp: new Date().toISOString(),
    facility: "Munich Distribution Hub"
  };

  // Replay from 10 minutes ago (600,000ms old)
  const expiredTimestamp = (Date.now() - 600_000).toString();
  const rawBody = JSON.stringify(payload);
  const secret = getCarrierSecret("DHL");
  const validSignatureForOldPayload = generateHmacSignature(rawBody, expiredTimestamp, secret);

  const response = await app.inject({
    method: "POST",
    url: "/api/v1/webhooks/carrier",
    headers: {
      "content-type": "application/json",
      "x-carrier-id": "DHL",
      "x-carrier-timestamp": expiredTimestamp,
      "x-carrier-signature": validSignatureForOldPayload,
    },
    payload,
  });

  assert.equal(response.statusCode, 401);
  const result = JSON.parse(response.payload);
  assert.equal(result.error, "Unauthorized");
  assert.match(result.reason, /replay attack detected/i);

  await app.close();
});

test("Slice 2 Security Lock: Rejects tampered payload body after signing (HTTP 401)", async () => {
  process.env.NODE_ENV = "test";
  const app = await buildServer();

  const originalPayload = {
    trackingNumber: "DHL-INTEGRITY-001",
    statusCode: "PU",
    timestamp: new Date().toISOString(),
    facility: "Berlin Central Station"
  };

  const rawOriginal = JSON.stringify(originalPayload);
  const timestamp = Date.now().toString();
  const secret = getCarrierSecret("DHL");
  const signature = generateHmacSignature(rawOriginal, timestamp, secret);

  // Attacker alters payload status to DLV (Delivered)
  const tamperedPayload = { ...originalPayload, statusCode: "DLV" };

  const response = await app.inject({
    method: "POST",
    url: "/api/v1/webhooks/carrier",
    headers: {
      "content-type": "application/json",
      "x-carrier-id": "DHL",
      "x-carrier-timestamp": timestamp,
      "x-carrier-signature": signature,
    },
    payload: tamperedPayload,
  });

  assert.equal(response.statusCode, 401);
  const result = JSON.parse(response.payload);
  assert.equal(result.error, "Unauthorized");

  await app.close();
});

test("Slice 2 Schema Guard: Rejects malformed carrier payload failing Zod validation (HTTP 400)", async () => {
  process.env.NODE_ENV = "test";
  const app = await buildServer();

  // Invalid container number (violates BIC 4-letter + 7-digit standard)
  const badMaerskPayload = {
    containerNumber: "INVALID_CONTAINER_123",
    eventType: "GATE_IN",
    recordedAt: new Date().toISOString(),
    portCode: "DEHAM"
  };

  const rawBody = JSON.stringify(badMaerskPayload);
  const timestamp = Date.now().toString();
  const secret = getCarrierSecret("MAERSK");
  const signature = generateHmacSignature(rawBody, timestamp, secret);

  const response = await app.inject({
    method: "POST",
    url: "/api/v1/webhooks/carrier",
    headers: {
      "content-type": "application/json",
      "x-carrier-id": "MAERSK",
      "x-carrier-timestamp": timestamp,
      "x-carrier-signature": signature,
    },
    payload: badMaerskPayload,
  });

  assert.equal(response.statusCode, 400);
  const result = JSON.parse(response.payload);
  assert.equal(result.error, "Bad Request");
  assert.match(result.message, /schema validation/i);

  await app.close();
});

test("Slice 2 Tenant Isolation: Shipments query only returns events for the authenticated tenant", async () => {
  process.env.NODE_ENV = "test";
  const app = await buildServer();

  // Ingest event for Tenant A
  const payloadA = {
    trackingNumber: "DHL-TENANT-A",
    statusCode: "PU",
    timestamp: new Date().toISOString(),
    facility: "Nuremberg Depot"
  };
  const tsA = Date.now().toString();
  const sigA = generateHmacSignature(JSON.stringify(payloadA), tsA, getCarrierSecret("DHL"));

  await app.inject({
    method: "POST",
    url: "/api/v1/webhooks/carrier",
    headers: {
      "content-type": "application/json",
      "x-carrier-id": "DHL",
      "x-carrier-timestamp": tsA,
      "x-carrier-signature": sigA,
      "x-tenant-id": "TENANT-BMW"
    },
    payload: payloadA,
  });

  // Ingest event for Tenant B
  const payloadB = {
    trackingNumber: "DHL-TENANT-B",
    statusCode: "DLV",
    timestamp: new Date().toISOString(),
    facility: "Munich Depot"
  };
  const tsB = Date.now().toString();
  const sigB = generateHmacSignature(JSON.stringify(payloadB), tsB, getCarrierSecret("DHL"));

  await app.inject({
    method: "POST",
    url: "/api/v1/webhooks/carrier",
    headers: {
      "content-type": "application/json",
      "x-carrier-id": "DHL",
      "x-carrier-timestamp": tsB,
      "x-carrier-signature": sigB,
      "x-tenant-id": "TENANT-SIEMENS"
    },
    payload: payloadB,
  });

  // Query as Tenant BMW
  const responseBMW = await app.inject({
    method: "GET",
    url: "/api/v1/shipments/events?tenantId=TENANT-BMW",
  });
  const dataBMW = JSON.parse(responseBMW.payload);
  assert.equal(dataBMW.count, 1);
  assert.equal(dataBMW.events[0].carrierReference, "DHL-TENANT-A");

  // Query as Tenant SIEMENS
  const responseSiemens = await app.inject({
    method: "GET",
    url: "/api/v1/shipments/events?tenantId=TENANT-SIEMENS",
  });
  const dataSiemens = JSON.parse(responseSiemens.payload);
  assert.equal(dataSiemens.count, 1);
  assert.equal(dataSiemens.events[0].carrierReference, "DHL-TENANT-B");

  await app.close();
});
