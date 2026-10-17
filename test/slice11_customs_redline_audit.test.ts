import test from "node:test";
import assert from "node:assert/strict";
import { buildServer } from "../src/server.js";
import { CustomsAuditorService } from "../src/services/customsAuditor.js";

/**
 * Automated Verification Suite for Slice 11:
 * Customs Pre-Clearance Redline Audit & 3-Way Reconciliation Engine
 * WHY: Proves that cross-document discrepancies (weights, Colli, container checksums)
 * are deterministically intercepted before seaport gate-in (Habit 08).
 */

test("Slice 11: ISO 6346 Modulo-11 Checksum validates authentic containers and catches corruptions", () => {
  // Valid container number MSKU9081246 (Maersk standard, check digit 6)
  const validResult = CustomsAuditorService.calculateIso6346CheckDigit("MSKU9081246");
  assert.equal(validResult.isValid, true);
  assert.equal(validResult.declaredDigit, 6);
  assert.equal(validResult.calculatedDigit, 6);

  // Corrupted container with altered digit: MSKU9081249
  const invalidResult = CustomsAuditorService.calculateIso6346CheckDigit("MSKU9081249");
  assert.equal(invalidResult.isValid, false);
  assert.equal(invalidResult.declaredDigit, 9);
  assert.equal(invalidResult.calculatedDigit, 6);
  assert.match(invalidResult.message, /Prüfziffernfehler/);

  // Invalid length
  const badLen = CustomsAuditorService.calculateIso6346CheckDigit("SHORT123");
  assert.equal(badLen.isValid, false);
});

test("Slice 11: 3-Way Reconciliation passes clean dossier with 100% match and zero demurrage liability", () => {
  const samples = CustomsAuditorService.getSampleDossiers();
  const clean = samples.clean;

  const result = CustomsAuditorService.reconcileDossier(
    clean.shipmentId,
    clean.bol,
    clean.atlas,
    clean.invoice,
    "de"
  );

  assert.equal(result.status, "PERFECT_MATCH");
  assert.equal(result.discrepancyCount, 0);
  assert.equal(result.demurrageRiskEur, 0);
  assert.equal(result.containerChecksumValid, true);
  assert.equal(result.weightToleranceValid, true);
  assert.equal(result.packageCountMatched, true);
  assert.match(result.actionRequiredDe, /Freigabe für Seehafen-Zulauf/);
  assert.match(result.adspNoticeTextDe, /3-WEGE-DOKUMENTENABGLEICH BESTANDEN/);
  assert.ok(result.auditHash.length === 64);
});

test("Slice 11: 3-Way Reconciliation catches weight and package variances and generates ADSp 2017 Notice", () => {
  const samples = CustomsAuditorService.getSampleDossiers();
  const disc = samples.discrepancy;

  const result = CustomsAuditorService.reconcileDossier(
    disc.shipmentId,
    disc.bol,
    disc.atlas,
    disc.invoice,
    "de"
  );

  assert.equal(result.status, "QUARANTINE_HOLD");
  assert.ok(result.discrepancyCount >= 2);
  assert.equal(result.weightToleranceValid, false);
  assert.equal(result.packageCountMatched, false);
  assert.ok(result.demurrageRiskEur >= 1000);
  assert.match(result.adspNoticeTextDe, /SPEDITIONS-BEANSTANDUNG & DISKREPANZ-AVIS/);
  assert.match(result.adspNoticeTextDe, /ADSp 2017 Ziff\. 19/);
  assert.match(result.adspNoticeTextDe, /§ 412 HGB/);
});

test("Slice 11 API: GET /api/v1/customs/samples provides preloaded verification dossiers", async () => {
  process.env.NODE_ENV = "test";
  const app = await buildServer();

  const res = await app.inject({
    method: "GET",
    url: "/api/v1/customs/samples",
  });

  assert.equal(res.statusCode, 200);
  const data = JSON.parse(res.payload);
  assert.equal(data.status, "success");
  assert.ok(data.samples.clean);
  assert.ok(data.samples.discrepancy);

  await app.close();
});

test("Slice 11 API: POST /api/v1/customs/reconcile executes cross-document audit", async () => {
  process.env.NODE_ENV = "test";
  const app = await buildServer();
  const samples = CustomsAuditorService.getSampleDossiers();

  const res = await app.inject({
    method: "POST",
    url: "/api/v1/customs/reconcile",
    payload: {
      shipmentId: "SHP-SIS-1049",
      bol: samples.clean.bol,
      atlas: samples.clean.atlas,
      invoice: samples.clean.invoice,
      lang: "en",
    },
  });

  assert.equal(res.statusCode, 200);
  const data = JSON.parse(res.payload);
  assert.equal(data.status, "PERFECT_MATCH");
  assert.equal(data.containerChecksumValid, true);
  assert.match(data.adspNoticeTextEn, /3-WAY RECONCILIATION AUDIT PASSED/);

  await app.close();
});

test("Slice 11 Portal UI: /portal/documents renders interactive Redline Audit Cockpit and sample switcher", async () => {
  process.env.NODE_ENV = "test";
  const app = await buildServer();

  // 1. Clean dossier view
  const resClean = await app.inject({
    method: "GET",
    url: "/portal/documents?sample=clean&lang=de",
  });

  assert.equal(resClean.statusCode, 200);
  assert.match(resClean.payload, /REDLINE ENGINE/);
  assert.match(resClean.payload, /3-Wege-Dokumentenabgleich &amp; Zoll-Vorabfertigung|3-Wege-Dokumentenabgleich & Zoll-Vorabfertigung/);
  assert.match(resClean.payload, /ATLAS 9\.1 &amp; ADSp 2017|ATLAS 9\.1 & ADSp 2017/);
  assert.match(resClean.payload, /100% Konform/);
  assert.match(resClean.payload, /MSKU9081246/);

  // 2. Discrepancy dossier view
  const resDisc = await app.inject({
    method: "GET",
    url: "/portal/documents?sample=discrepancy&lang=de",
  });

  assert.equal(resDisc.statusCode, 200);
  assert.match(resDisc.payload, /Quarantäne-Hold/);
  assert.match(resDisc.payload, /ADSp-Beanstandung kopieren/);
  assert.match(resDisc.payload, /Delta: 220\.0 kg/);

  await app.close();
});
