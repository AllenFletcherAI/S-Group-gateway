import test from "node:test";
import assert from "node:assert/strict";
import { buildServer } from "../src/server.js";
import { generateHmacSignature } from "../src/middleware/webhookAuth.js";
import { getCarrierSecret, clearIngestedEvents } from "../src/routes/webhooks.js";

/**
 * Automated Verification Suite for Slice 3: Unified Shipment Status & Timeline
 * WHY: Proves multi-tenant isolation (zero IDOR), dynamic carrier timeline merging,
 * customs document verification, and accessible portal tracking views (Habits 08, 18, 20).
 */

test.beforeEach(() => {
  clearIngestedEvents();
});

test("Slice 3: API returns tenant-isolated shipments for DE-SIS-8921", async () => {
  process.env.NODE_ENV = "test";
  const app = await buildServer();

  const response = await app.inject({
    method: "GET",
    url: "/api/v1/shipments",
    headers: {
      "x-tenant-id": "DE-SIS-8921"
    }
  });

  assert.equal(response.statusCode, 200);
  const data = JSON.parse(response.payload);
  assert.equal(data.tenantId, "DE-SIS-8921");
  assert.equal(data.count, 3);

  // Proves competitor shipment is never leaked (Zero IDOR / BOLA)
  const competitorShipment = data.shipments.find((s: any) => s.shipmentId === "SHP-OTHER-9901");
  assert.equal(competitorShipment, undefined);

  await app.close();
});

test("Slice 3: Filters shipments by carrier and search query", async () => {
  process.env.NODE_ENV = "test";
  const app = await buildServer();

  // Filter by Carrier: SCHENKER
  const carrierRes = await app.inject({
    method: "GET",
    url: "/api/v1/shipments?carrier=SCHENKER",
    headers: { "x-tenant-id": "DE-SIS-8921" }
  });
  const carrierData = JSON.parse(carrierRes.payload);
  assert.equal(carrierData.count, 1);
  assert.equal(carrierData.shipments[0].carrier, "SCHENKER");
  assert.equal(carrierData.shipments[0].shipmentId, "SHP-SIS-2088");

  // Search by keyword: 'Shanghai'
  const searchRes = await app.inject({
    method: "GET",
    url: "/api/v1/shipments?q=Shanghai",
    headers: { "x-tenant-id": "DE-SIS-8921" }
  });
  const searchData = JSON.parse(searchRes.payload);
  assert.equal(searchData.count, 1);
  assert.equal(searchData.shipments[0].carrier, "MAERSK");

  await app.close();
});

test("Slice 3: Ingested carrier webhook dynamically merges into shipment timeline", async () => {
  process.env.NODE_ENV = "test";
  const app = await buildServer();

  // Ingest DHL customs clearance event for tracking ref DHL-HAM-992182
  const dhlPayload = {
    trackingNumber: "DHL-HAM-992182",
    statusCode: "CST_CLR",
    timestamp: new Date().toISOString(),
    facility: "Zollamt Waltershof Hamburg",
    notes: "ATLAS Freigabe erfolgreich übermittelt"
  };
  const rawBody = JSON.stringify(dhlPayload);
  const ts = Date.now().toString();
  const sig = generateHmacSignature(rawBody, ts, getCarrierSecret("DHL"));

  await app.inject({
    method: "POST",
    url: "/api/v1/webhooks/carrier",
    headers: {
      "content-type": "application/json",
      "x-carrier-id": "DHL",
      "x-carrier-timestamp": ts,
      "x-carrier-signature": sig,
      "x-tenant-id": "DE-SIS-8921"
    },
    payload: dhlPayload,
  });

  // Query shipment timeline
  const response = await app.inject({
    method: "GET",
    url: "/api/v1/shipments/SHP-SIS-1049",
    headers: { "x-tenant-id": "DE-SIS-8921" }
  });

  assert.equal(response.statusCode, 200);
  const data = JSON.parse(response.payload);
  assert.equal(data.shipment.shipmentId, "SHP-SIS-1049");

  // Proves that timeline has baseline dispatch AND the live ingested milestone
  assert.equal(data.timeline.length, 2);
  assert.equal(data.timeline[0].milestone, "BOOKING_CREATED");
  assert.equal(data.timeline[1].milestone, "CUSTOMS_CLEARED");
  assert.equal(data.timeline[1].source, "CARRIER_TELEMATICS");
  assert.match(data.timeline[1].location, /Zollamt Waltershof/);

  await app.close();
});

test("Slice 3 Security Lock: Rejects unauthorized cross-tenant shipment access with 404 (Zero IDOR)", async () => {
  process.env.NODE_ENV = "test";
  const app = await buildServer();

  // Tenant DE-SIS-8921 attempts to access competitor shipment SHP-OTHER-9901
  const response = await app.inject({
    method: "GET",
    url: "/api/v1/shipments/SHP-OTHER-9901",
    headers: { "x-tenant-id": "DE-SIS-8921" }
  });

  assert.equal(response.statusCode, 404);
  const result = JSON.parse(response.payload);
  assert.equal(result.error, "Not Found");
  assert.match(result.message, /not found or unauthorized/i);

  await app.close();
});

test("Slice 3: Customs document verification receipt endpoint functions properly", async () => {
  process.env.NODE_ENV = "test";
  const app = await buildServer();

  const response = await app.inject({
    method: "GET",
    url: "/api/v1/documents/DOC-ATLAS-891/download",
    headers: { "x-tenant-id": "DE-SIS-8921" }
  });

  assert.equal(response.statusCode, 200);
  const data = JSON.parse(response.payload);
  assert.equal(data.status, "verified");
  assert.equal(data.document.docId, "DOC-ATLAS-891");
  assert.equal(data.document.docType, "ATLAS_ZOLL");
  assert.ok(data.hash.startsWith("SHA256-"));

  await app.close();
});

test("Slice 3: Portal views render shipment directory, timeline, and customs paperwork", async () => {
  process.env.NODE_ENV = "test";
  const app = await buildServer();

  // 1. Shipment Directory View
  const listRes = await app.inject({
    method: "GET",
    url: "/portal/shipments",
  });
  assert.equal(listRes.statusCode, 200);
  assert.match(listRes.payload, /SHP-SIS-1049/);
  assert.match(listRes.payload, /Hamburg Hafen/);
  assert.match(listRes.payload, /Live-Tracking &amp; Timeline|Live-Tracking & Timeline/);

  // 2. Live Tracking View
  const trackRes = await app.inject({
    method: "GET",
    url: "/portal/tracking?id=SHP-SIS-1049",
  });
  assert.equal(trackRes.statusCode, 200);
  assert.match(trackRes.payload, /SHP-SIS-1049/);
  assert.match(trackRes.payload, /Live-Telemetrie Status-Timeline/);
  assert.match(trackRes.payload, /DOC-ATLAS-891/);
  assert.match(trackRes.payload, /Zollanmeldung/);

  // 3. Customs Documents Archive View
  const docsRes = await app.inject({
    method: "GET",
    url: "/portal/documents",
  });
  assert.equal(docsRes.statusCode, 200);
  assert.match(docsRes.payload, /Zolldokumente &amp; Frachtbrief-Archiv|Zolldokumente & Frachtbrief-Archiv/);
  assert.match(docsRes.payload, /ATLAS Zollanmeldung/);
  assert.match(docsRes.payload, /CMR-Frachtbrief/);

  await app.close();
});
