import { test } from "node:test";
import assert from "node:assert/strict";
import { TelematicsPrunerService } from "../src/services/telematicsPruner.js";
import { buildServer } from "../src/server.js";

test("Slice 6 Compliance Service: Dry-run sweep simulates 90-day pruning without mutating ledger", () => {
  const initialLedger = TelematicsPrunerService.getPruningLedger("DE-SIS-8921");
  const initialCount = initialLedger.length;

  const result = TelematicsPrunerService.executeSweep("DE-SIS-8921", true);

  assert.equal(result.status, "DRY_RUN");
  assert.equal(result.tenantId, "DE-SIS-8921");
  assert.equal(result.recordsPurged, 0, "Dry run must purge 0 live records");
  assert.ok(result.recordsEvaluated > 0, "Must evaluate records");
  assert.match(result.auditHash, /^[a-f0-9]{64}$/i, "Must generate valid SHA-256 audit hash");

  const postLedger = TelematicsPrunerService.getPruningLedger("DE-SIS-8921");
  assert.equal(postLedger.length, initialCount, "Dry run must not append to immutable ledger");
});

test("Slice 6 Compliance Service: Live sweep executes 90-day pruning and logs receipt to ledger", () => {
  const initialLedger = TelematicsPrunerService.getPruningLedger("DE-SIS-8921");
  const initialCount = initialLedger.length;

  const result = TelematicsPrunerService.executeSweep("DE-SIS-8921", false);

  assert.equal(result.status, "COMPLETED");
  assert.match(result.sweepId, /^SWEEP-\d{4}-\d{2}-\d{2}-[A-F0-9]{6}$/);
  assert.match(result.legalBasis, /DSGVO Art\. 5/);
  assert.ok(result.recordsPurged > 0, "Live sweep must purge expired telemetry");
  assert.match(result.auditHash, /^[a-f0-9]{64}$/i);

  const postLedger = TelematicsPrunerService.getPruningLedger("DE-SIS-8921");
  assert.equal(postLedger.length, initialCount + 1, "Live sweep must append entry to ledger");
  assert.equal(postLedger[0].sweepId, result.sweepId);
});

test("Slice 6 Compliance Service: Art. 15 Data Package generates verifiable export with SHA-256 checksum", () => {
  const exportPkg = TelematicsPrunerService.generateTenantExport("DE-SIS-8921");

  assert.equal(exportPkg.exportMetadata.tenantId, "DE-SIS-8921");
  assert.match(exportPkg.exportMetadata.complianceStandard, /GDPR Art\. 15/);
  assert.match(exportPkg.exportMetadata.sha256Checksum, /^[a-f0-9]{64}$/i);
  assert.equal(exportPkg.privacyGuarantees.telematicsRetentionDays, 90);
  assert.equal(exportPkg.privacyGuarantees.logRedactionEnforced, true);

  // Assert tenant isolation in export: All shipments belong to DE-SIS-8921
  for (const s of exportPkg.shipments) {
    assert.equal(s.tenantId, "DE-SIS-8921");
  }
  assert.ok(exportPkg.pruningHistory.length > 0, "Export must include historical pruning receipts");
});

test("Slice 6 API: Compliance REST endpoints support export, ledger query, and pruning trigger", async () => {
  const app = await buildServer();

  // 1. Export JSON endpoint
  const exportRes = await app.inject({
    method: "GET",
    url: "/api/v1/compliance/export?tenantId=DE-SIS-8921",
  });
  assert.equal(exportRes.statusCode, 200);
  const exportJson = JSON.parse(exportRes.payload);
  assert.equal(exportJson.exportMetadata.tenantId, "DE-SIS-8921");

  // 2. Export Download Header endpoint
  const downloadRes = await app.inject({
    method: "GET",
    url: "/api/v1/compliance/export?tenantId=DE-SIS-8921&download=true",
  });
  assert.equal(downloadRes.statusCode, 200);
  assert.match(downloadRes.headers["content-disposition"] || "", /attachment;\s+filename="dsgvo-art15-export-DE-SIS-8921\.json"/);

  // 3. Ledger endpoint
  const ledgerRes = await app.inject({
    method: "GET",
    url: "/api/v1/compliance/ledger?tenantId=DE-SIS-8921",
  });
  assert.equal(ledgerRes.statusCode, 200);
  const ledgerJson = JSON.parse(ledgerRes.payload);
  assert.equal(ledgerJson.retentionPolicyDays, 90);
  assert.ok(Array.isArray(ledgerJson.ledger));

  // 4. Trigger Prune Endpoint (Dry Run)
  const pruneRes = await app.inject({
    method: "POST",
    url: "/api/v1/compliance/prune",
    payload: { tenantId: "DE-SIS-8921", dryRun: true },
  });
  assert.equal(pruneRes.statusCode, 200);
  const pruneJson = JSON.parse(pruneRes.payload);
  assert.equal(pruneJson.success, true);
  assert.equal(pruneJson.mode, "DRY_RUN");

  await app.close();
});

test("Slice 6 Portal: /portal/compliance renders interactive DSGVO Cockpit and pruning ledger", async () => {
  const app = await buildServer();

  const res = await app.inject({
    method: "GET",
    url: "/portal/compliance",
  });

  assert.equal(res.statusCode, 200);
  const body = res.body;

  assert.match(body, /Datenschutz & Compliance Cockpit/i);
  assert.match(body, /90-Tage Telemetrie-Löschmaschine/i);
  assert.match(body, /Recht auf Auskunft \(Art\. 15 DSGVO\)/i);
  assert.match(body, /Unveränderliches Löschprotokoll/i);
  assert.match(body, /SWEEP-2026/i, "Must render historical pruning sweep entries in table");

  await app.close();
});
