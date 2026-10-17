import test from "node:test";
import assert from "node:assert/strict";
import { buildServer } from "../src/server.js";

/**
 * Automated Verification Suite for Slice 1: Layout & Navigation Header
 * WHY: Proves that the layout, S-Group branding, tenant context, and DSGVO badges
 * render properly and pass HTTP invariant checks (Habit 08).
 */

test("Slice 1: Health check endpoint returns operational and safety invariants", async () => {
  process.env.NODE_ENV = "test";
  const app = await buildServer();

  const response = await app.inject({
    method: "GET",
    url: "/health",
  });

  assert.equal(response.statusCode, 200);
  const payload = JSON.parse(response.payload);
  assert.equal(payload.status, "operational");
  assert.equal(payload.service, "s-group-gateway");
  assert.equal(payload.invariants.dsgvoCompliance, "enforced");
  assert.equal(payload.invariants.tenantIsolation, "active");
  assert.equal(payload.invariants.telematicsRetentionDays, 90);

  await app.close();
});

test("Slice 1: Root path redirects to /portal", async () => {
  process.env.NODE_ENV = "test";
  const app = await buildServer();

  const response = await app.inject({
    method: "GET",
    url: "/",
  });

  assert.equal(response.statusCode, 302);
  assert.equal(response.headers.location, "/portal");

  await app.close();
});

test("Slice 1: Portal renders S-Group branding, tenant indicator, and nav header (DE)", async () => {
  process.env.NODE_ENV = "test";
  const app = await buildServer();

  const response = await app.inject({
    method: "GET",
    url: "/portal",
  });

  assert.equal(response.statusCode, 200);
  assert.match(response.headers["content-type"] || "", /text\/html/);

  const html = response.payload;

  // S-Group Branding Checks
  assert.match(html, /S-GROUP/);
  assert.match(html, /Schäfer &amp; SIS Interlogistik|Schäfer & SIS Interlogistik/);

  // Tenant Isolation Context Check
  assert.match(html, /DE-SIS-8921/);

  // DSGVO / Privacy Badge Check
  assert.match(html, /DSGVO \/ GDPR Compliant/);
  assert.match(html, /Telemetriedaten werden nach 90 Tagen automatisch anonymisiert/);

  // Accessibility Check: Skip link
  assert.match(html, /skip-to-content/);

  // Navigation Links Check (DE) - 5 Operational Assembly Line Tabs
  assert.match(html, /Dokumenten-Audit/);
  assert.match(html, /3-Wege-Abgleich/);
  assert.match(html, /Quarantäne &amp; Standgeld|Quarantäne & Standgeld/);
  assert.match(html, /Disposition &amp; Telemetrie|Disposition & Telemetrie/);
  assert.match(html, /Audit-Ledger &amp; IT|Audit-Ledger & IT/);

  // Main Navigation Check (clean bar without redundant drawer)
  assert.match(html, /desktop-nav/);
  assert.doesNotMatch(html, /mobile-nav-drawer/);

  await app.close();
});

test("Slice 1: Portal renders English labels when requested with ?lang=en", async () => {
  process.env.NODE_ENV = "test";
  const app = await buildServer();

  const response = await app.inject({
    method: "GET",
    url: "/portal?lang=en",
  });

  assert.equal(response.statusCode, 200);
  const html = response.payload;

  assert.match(html, /Document Audit/);
  assert.match(html, /3-Way Match/);
  assert.match(html, /Quarantine &amp; Demurrage|Quarantine & Demurrage/);
  assert.match(html, /Dispatch &amp; Telematics|Dispatch & Telematics/);
  assert.match(html, /Audit-Ledger &amp; IT|Audit-Ledger & IT/);
  assert.match(html, /Welcome to the S-Group Gateway/);

  await app.close();
});

test("Slice 1: Static layout.css stylesheet is served correctly", async () => {
  process.env.NODE_ENV = "test";
  const app = await buildServer();

  const response = await app.inject({
    method: "GET",
    url: "/static/css/layout.css",
  });

  assert.equal(response.statusCode, 200);
  assert.match(response.payload, /--color-navy-dark: #0B192C/);
  assert.match(response.payload, /--color-signal-blue: #0284C7/);

  await app.close();
});
