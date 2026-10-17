import test from "node:test";
import assert from "node:assert/strict";
import { buildServer } from "../src/server.js";

/**
 * Automated Verification Suite for Slice 14:
 * Operational Assembly Line Pipeline & RedLine Feature Harmonization (Tabs 1-5)
 *
 * WHY: Proves that S-Group Gateway functions as an active operational workstation
 * following the container lifecycle (Audit -> 3-Way Reconcile -> Quarantine -> Dispatch -> GoBD Ledger),
 * with pan/zoom canvas, sample doc assets, and A4 compliance certificates (Habit 08).
 */

test("Slice 14: Executive KPI Ribbon renders 4 clickable status chips in the main header", async () => {
  process.env.NODE_ENV = "test";
  const app = await buildServer();

  const res = await app.inject({
    method: "GET",
    url: "/portal?lang=de",
  });

  assert.equal(res.statusCode, 200);
  const html = res.payload;

  // 4 Clickable Executive KPI Chips
  assert.match(html, /header-kpi-strip/);
  assert.match(html, /Verarbeitet:/);
  assert.match(html, /stat-total/);
  assert.match(html, /Clean:/);
  assert.match(html, /stat-clean/);
  assert.match(html, /Quarantäne:/);
  assert.match(html, /stat-holds/);
  assert.match(html, /Standgeld vermieden:/);
  assert.match(html, /stat-demurrage/);
  assert.match(html, /href="\/portal\/ledger\?lang=de"/);
  assert.match(html, /href="\/portal\/quarantine\?lang=de"/);

  await app.close();
});

test("Slice 14 - Tab 1: GET /portal/audit renders split-screen canvas and 5-stage customs validation", async () => {
  process.env.NODE_ENV = "test";
  const app = await buildServer();

  const res = await app.inject({
    method: "GET",
    url: "/portal/audit?lang=de",
  });

  assert.equal(res.statusCode, 200);
  const html = res.payload;

  // Split Workspace
  assert.match(html, /split-audit-workspace/);
  assert.match(html, /audit-pane-left/);
  assert.match(html, /audit-pane-right/);

  // Pan / Zoom Controls & Canvas
  assert.match(html, /audit-canvas-viewport/);
  assert.match(html, /audit-preview-img/);
  assert.match(html, /zoomAuditCanvas/);
  assert.match(html, /fitAuditWidth/);
  assert.match(html, /rotateAuditCanvas/);

  // Sample Documents Switcher
  assert.match(html, /loadSampleDoc\('bol'\)/);
  assert.match(html, /loadSampleDoc\('invoice'\)/);
  assert.match(html, /loadSampleDoc\('packing_list'\)/);

  // 5-Stage Checklist
  assert.match(html, /5-Stufen Zoll- &amp; Dokumentenprüfung|5-Stufen Zoll- & Dokumentenprüfung/);
  assert.match(html, /Dateinintegrität &amp; SHA-256 Signatur|Dateinintegrität & SHA-256 Signatur/);
  assert.match(html, /OCR &amp; Strukturierte Entitätserkennung|OCR & Strukturierte Entitätserkennung/);
  assert.match(html, /ISO 6346 Modulo-11/);
  assert.match(html, /ADSp 2017 &amp; SOLAS VGM Toleranzprüfung|ADSp 2017 & SOLAS VGM Toleranzprüfung/);
  assert.match(html, /ATLAS Pre-Clearance Entscheidung/);

  await app.close();
});

test("Slice 14 - Tab 2: GET /portal/reconcile renders 3 intake slots, scenario switcher, and matrix", async () => {
  process.env.NODE_ENV = "test";
  const app = await buildServer();

  // Test Clean Scenario
  const resClean = await app.inject({
    method: "GET",
    url: "/portal/reconcile?sample=clean&lang=de",
  });

  assert.equal(resClean.statusCode, 200);
  const htmlClean = resClean.payload;

  assert.match(htmlClean, /3-Wege-Zollabgleich/);
  assert.match(htmlClean, /dossier-slots-container/);
  assert.match(htmlClean, /1\. Frachturkunde \(B\/L\)/);
  assert.match(htmlClean, /2\. Handelsrechnung/);
  assert.match(htmlClean, /3\. Packliste \/ ATLAS/);
  assert.match(htmlClean, /reconcile-matrix-table/);
  assert.match(htmlClean, /3-Wege-Abgleich ERFOLGREICH/);

  // Test Discrepancy Scenario (Demurrage Trap)
  const resDiscrepancy = await app.inject({
    method: "GET",
    url: "/portal/reconcile?sample=discrepancy&lang=de",
  });

  assert.equal(resDiscrepancy.statusCode, 200);
  const htmlDiscrepancy = resDiscrepancy.payload;

  assert.match(htmlDiscrepancy, /Diskrepanz erkannt/);
  assert.match(htmlDiscrepancy, /In Quarantäne-Konsole öffnen/);

  await app.close();
});

test("Slice 14 - Tab 3: GET /portal/quarantine renders active holds queue and ADSp 2017 claim generator", async () => {
  process.env.NODE_ENV = "test";
  const app = await buildServer();

  const res = await app.inject({
    method: "GET",
    url: "/portal/quarantine?lang=de",
  });

  assert.equal(res.statusCode, 200);
  const html = res.payload;

  // Cockpit Header & KPIs
  assert.match(html, /Quarantäne-Leitstand &amp; Demurrage-Schutz|Quarantäne-Leitstand & Demurrage-Schutz/);
  assert.match(html, /quarantine-kpi-grid/);
  assert.match(html, /Aktive Quarantäne-Fälle/);
  assert.match(html, /Abgewendete Standgelder/);

  // Active Hold Rows
  assert.match(html, /MSKU7829104/);
  assert.match(html, /\+220 kg VGM Delta/);
  assert.match(html, /350 € \/ Tag/);

  // ADSp 2017 Claim Modal
  assert.match(html, /modal-adsp-claim/);
  assert.match(html, /ADSp 2017 Ziff\. 19/);
  assert.match(html, /§ 412 HGB/);

  await app.close();
});

test("Slice 14 - Tab 4: GET /portal/dispatch unifies sovereign corridor map and multimodal fleet dispatch", async () => {
  process.env.NODE_ENV = "test";
  const app = await buildServer();

  const res = await app.inject({
    method: "GET",
    url: "/portal/dispatch?lang=de",
  });

  assert.equal(res.statusCode, 200);
  const html = res.payload;

  // Sovereign Telematics Map must be embedded
  assert.match(html, /telematics-map-card/);
  assert.match(html, /telematics-svg/);
  assert.match(html, /LIVE TELEMETRIE/);

  // Multimodal Feeder Dispatch Board must be embedded
  assert.match(html, /dispatch-layout-container/);
  assert.match(html, /Tourendisposition &amp; Zubringernetz|Tourendisposition & Zubringernetz/);
  assert.match(html, /load-fill/);

  await app.close();
});

test("Slice 14 - Tab 5: GET /portal/ledger renders GoBD ledger, DIN A4 certificate modal, and IT console", async () => {
  process.env.NODE_ENV = "test";
  const app = await buildServer();

  const res = await app.inject({
    method: "GET",
    url: "/portal/ledger?lang=de",
  });

  assert.equal(res.statusCode, 200);
  const html = res.payload;

  // GoBD Ledger
  assert.match(html, /Revisionssicheres Audit-Ledger/);
  assert.match(html, /§ 147 AO/);
  assert.match(html, /First-Time-Right Rate/);

  // Official DIN A4 Customs Compliance Certificate Modal
  assert.match(html, /modal-customs-cert/);
  assert.match(html, /BUNDESREPUBLIK DEUTSCHLAND/);
  assert.match(html, /ZOLL-COMPLIANCE &amp; DETERMINISTISCHES PRÜFPROTOKOLL|ZOLL-COMPLIANCE & DETERMINISTISCHES PRÜFPROTOKOLL/);
  assert.match(html, /Als DIN A4 Dokument drucken/);

  // IT & ERP Console
  assert.match(html, /PostgreSQL Pool/);
  assert.match(html, /SAP IDoc DESADV/);
  assert.match(html, /UN\/EDIFACT IFTMIN/);

  await app.close();
});

test("Slice 14: Sample document image assets are properly served over static assets route", async () => {
  process.env.NODE_ENV = "test";
  const app = await buildServer();

  const res = await app.inject({
    method: "GET",
    url: "/static/sample_docs/sample bill of ladling.png",
  });

  assert.equal(res.statusCode, 200);
  assert.match(res.headers["content-type"] || "", /image\/png/);
  assert.ok(res.rawPayload.length > 50000);

  await app.close();
});
