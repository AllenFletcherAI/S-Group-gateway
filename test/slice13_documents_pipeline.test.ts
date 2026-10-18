import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildServer } from "../src/server.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test("Slice 13 Documents Pipeline: GET /api/v1/documents/sample/:type executes 5-stage deterministic audit", async () => {
  const app = await buildServer();

  // Test loading Ocean B/L sample
  const bolRes = await app.inject({
    method: "GET",
    url: "/api/v1/documents/sample/bol"
  });

  assert.equal(bolRes.statusCode, 200);
  const bolJson = JSON.parse(bolRes.payload);
  assert.equal(bolJson.success, true);
  assert.equal(bolJson.document.containerNumber, "MSKU7829107");
  assert.equal(bolJson.document.grossWeightKg, 24500.0);
  assert.equal(bolJson.overallStatus, "VERIFIED_CLEAN");
  assert.equal(bolJson.atlasReady, true);
  assert.equal(bolJson.stages.length, 5);
  assert.ok(bolJson.sha256.length === 64);

  // Test loading Commercial Invoice sample
  const invRes = await app.inject({
    method: "GET",
    url: "/api/v1/documents/sample/invoice"
  });

  assert.equal(invRes.statusCode, 200);
  const invJson = JSON.parse(invRes.payload);
  assert.equal(invJson.success, true);
  assert.equal(invJson.document.documentType, "Commercial Invoice");
  assert.equal(invJson.document.totalAmount, 184200.0);
  assert.equal(invJson.document.currency, "EUR");

  // Test loading Packing List sample (triggers tare tolerance hold due to +220kg delta)
  const plRes = await app.inject({
    method: "GET",
    url: "/api/v1/documents/sample/packing_list"
  });

  assert.equal(plRes.statusCode, 200);
  const plJson = JSON.parse(plRes.payload);
  assert.equal(plJson.success, true);
  assert.equal(plJson.overallStatus, "QUARANTINE_HOLD");
  assert.equal(plJson.demurrageRiskDetected, true);
  assert.ok(plJson.estimatedDemurrageLiabilityEur > 0);

  await app.close();
});

test("Slice 13 Documents Pipeline: POST /api/v1/documents/process processes base64 payload & returns SHA-256 seal", async () => {
  const app = await buildServer();

  const samplePath = path.resolve(__dirname, "..", "src", "public", "sample_docs", "sample bill of ladling.png");
  const buffer = fs.readFileSync(samplePath);
  const base64Data = buffer.toString("base64");

  const procRes = await app.inject({
    method: "POST",
    url: "/api/v1/documents/process",
    payload: {
      fileName: "sample bill of ladling.png",
      mimeType: "image/png",
      bufferBase64: base64Data
    }
  });

  assert.equal(procRes.statusCode, 200);
  const resJson = JSON.parse(procRes.payload);
  assert.equal(resJson.success, true);
  assert.equal(resJson.document.containerNumber, "MSKU7829107");
  assert.equal(resJson.stages[0].passed, true); // Stage 1 SHA-256
  assert.equal(resJson.stages[2].passed, true); // Stage 3 Modulo-11

  await app.close();
});

test("Slice 13 Customs Operations: Quarantine listing, CSV exports, and Supervisor Override", async () => {
  const app = await buildServer();

  // 1. List Quarantine Holds
  const quarRes = await app.inject({
    method: "GET",
    url: "/api/v1/customs/quarantine"
  });
  assert.equal(quarRes.statusCode, 200);
  const quarJson = JSON.parse(quarRes.payload);
  assert.ok(quarJson.count >= 3);
  assert.ok(Array.isArray(quarJson.cases));

  // 2. Execute Supervisor Override on SHP-SIS-1051
  const overrideRes = await app.inject({
    method: "POST",
    url: "/api/v1/customs/override",
    payload: {
      shipmentId: "SHP-SIS-1051",
      reason: "Handelsrechnung vom Kunden nachgereicht und durch Zollprüfung verifiziert.",
      operator: "Lead Dispatcher Max Mustermann"
    }
  });
  assert.equal(overrideRes.statusCode, 200);
  const overrideJson = JSON.parse(overrideRes.payload);
  assert.equal(overrideJson.success, true);
  assert.equal(overrideJson.status, "OVERRIDDEN_RELEASED");
  assert.equal(overrideJson.shipment.audit_status, "OVERRIDDEN_RELEASED");

  // 3. Reject invalid override missing reason
  const badOverride = await app.inject({
    method: "POST",
    url: "/api/v1/customs/override",
    payload: {
      shipmentId: "SHP-SIS-1051",
      reason: ""
    }
  });
  assert.equal(badOverride.statusCode, 400);

  // 4. Export Quarantine CSV
  const quarCsvRes = await app.inject({
    method: "GET",
    url: "/api/v1/compliance/quarantine/export"
  });
  assert.equal(quarCsvRes.statusCode, 200);
  assert.match(quarCsvRes.headers["content-type"] || "", /text\/csv/);
  assert.ok(quarCsvRes.payload.includes("Sendungsreferenz"));

  // 5. Export GoBD Ledger CSV
  const ledgerCsvRes = await app.inject({
    method: "GET",
    url: "/api/v1/compliance/ledger/export"
  });
  assert.equal(ledgerCsvRes.statusCode, 200);
  assert.match(ledgerCsvRes.headers["content-type"] || "", /text\/csv/);
  assert.ok(ledgerCsvRes.payload.includes("Kryptographischer Hash (SHA-256)"));

  // 6. Real Database Health Ping
  const dbHealthRes = await app.inject({
    method: "GET",
    url: "/api/v1/health/db"
  });
  assert.equal(dbHealthRes.statusCode, 200);
  const dbHealthJson = JSON.parse(dbHealthRes.payload);
  assert.equal(dbHealthJson.status, "UP");
  assert.ok(dbHealthJson.totalRecords > 0);
  assert.ok(typeof dbHealthJson.latencyMs === "number");

  // 7. Dynamic Executive KPI Metrics Ribbon
  const kpiRes = await app.inject({
    method: "GET",
    url: "/api/v1/metrics/kpi"
  });
  assert.equal(kpiRes.statusCode, 200);
  const kpiJson = JSON.parse(kpiRes.payload);
  assert.ok(kpiJson.totalProcessed > 0);
  assert.ok(kpiJson.verifiedClean > 0);
  assert.ok(typeof kpiJson.demurrageSavedEur === "number");

  await app.close();
});
