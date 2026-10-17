import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { DatabaseMigrator } from "../src/database/migrator.js";
import { generateSeedSql } from "../src/database/seed.js";
import { checkDatabaseHealth } from "../src/database/pool.js";
import { buildServer } from "../src/server.js";

test("Slice 10 Database Migrator: Loads and sorts all 5 migrations sequentially with checksums", () => {
  const migrations = DatabaseMigrator.loadMigrationFiles();

  assert.equal(migrations.length, 5, "Must contain exactly 5 core relational migrations");

  // Verify sequential ordering
  assert.equal(migrations[0].version, "V001");
  assert.equal(migrations[0].name, "init_tenants_and_shipments");

  assert.equal(migrations[1].version, "V002");
  assert.equal(migrations[1].name, "customs_documents_and_carrier_events");

  assert.equal(migrations[2].version, "V003");
  assert.equal(migrations[2].name, "feeder_dispatch_tours");

  assert.equal(migrations[3].version, "V004");
  assert.equal(migrations[3].name, "compliance_audit_ledger");

  assert.equal(migrations[4].version, "V005");
  assert.equal(migrations[4].name, "api_keys_and_credentials");

  // Verify SHA-256 checksums
  for (const m of migrations) {
    assert.equal(m.checksum.length, 64, `Migration ${m.fileName} must have a 64-char hex SHA-256 checksum`);
  }
});

test("Slice 10 Database Migrator: Verifies DDL statements and schema integrity", () => {
  const results = DatabaseMigrator.verifyMigrations();

  assert.equal(results.length, 5);
  for (const r of results) {
    assert.equal(r.status, "VERIFIED");
    assert.ok(r.statementsCount >= 2, `Migration ${r.version} must contain multiple discrete SQL DDL statements`);
  }
});

test("Slice 10 SQL Safety Invariants: Database enforces physical vehicle capacity and gross weight CHECK constraints", () => {
  const migrations = DatabaseMigrator.loadMigrationFiles();
  const v3 = migrations.find((m) => m.version === "V003");
  assert.ok(v3, "V003 migration must exist");

  // Verify physical constraint definitions in PostgreSQL DDL
  assert.match(
    v3.sqlContent,
    /CONSTRAINT\s+check_pallet_capacity\s+CHECK\s*\(\s*loaded_pallets\s*>=\s*0\s+AND\s+loaded_pallets\s*<=\s*max_pallets\s*\)/i,
    "V003 must enforce pallet capacity CHECK constraint in database engine"
  );

  assert.match(
    v3.sqlContent,
    /CONSTRAINT\s+check_weight_capacity\s+CHECK\s*\(\s*loaded_weight_kg\s*>=\s*0\s+AND\s+loaded_weight_kg\s*<=\s*max_weight_kg\s*\)/i,
    "V003 must enforce gross weight CHECK constraint in database engine"
  );
});

test("Slice 10 Relational Tenant Boundaries: Foreign keys anchor multi-tenant isolation", () => {
  const migrations = DatabaseMigrator.loadMigrationFiles();

  // Shipments must reference tenants
  const v1 = migrations.find((m) => m.version === "V001")!;
  assert.match(v1.sqlContent, /tenant_id\s+VARCHAR\(64\)\s+NOT\s+NULL\s+REFERENCES\s+tenants/i);

  // Feeder tours must reference tenants
  const v3 = migrations.find((m) => m.version === "V003")!;
  assert.match(v3.sqlContent, /tenant_id\s+VARCHAR\(64\)\s+NOT\s+NULL\s+REFERENCES\s+tenants/i);

  // Compliance prune ledger must reference tenants
  const v4 = migrations.find((m) => m.version === "V004")!;
  assert.match(v4.sqlContent, /tenant_id\s+VARCHAR\(64\)\s+NOT\s+NULL\s+REFERENCES\s+tenants/i);

  // API keys must reference tenants
  const v5 = migrations.find((m) => m.version === "V005")!;
  assert.match(v5.sqlContent, /tenant_id\s+VARCHAR\(64\)\s+NOT\s+NULL\s+REFERENCES\s+tenants/i);
});

test("Slice 10 Database Health & Fastify Integration: /health reports database status", async () => {
  const app = await buildServer();

  const res = await app.inject({
    method: "GET",
    url: "/health",
  });

  assert.equal(res.statusCode, 200);
  const data = JSON.parse(res.payload);

  assert.equal(data.status, "operational");
  assert.ok(data.database, "Health response must contain database probe object");
  assert.ok(["UP", "READY_STANDALONE"].includes(data.database.status));
  assert.ok(["POSTGRESQL_RELATIONAL", "STANDALONE_SEED_DRIVER"].includes(data.database.driver));
  assert.ok(data.database.details.message);

  await app.close();
});

test("Slice 10 Consolidated Schema & Seed Generation: Produces idempotent SQL bootstrap script", () => {
  const consolidated = DatabaseMigrator.generateConsolidatedSchema();
  assert.ok(consolidated.includes("CREATE TABLE IF NOT EXISTS tenants"));
  assert.ok(consolidated.includes("CREATE TABLE IF NOT EXISTS shipments"));
  assert.ok(consolidated.includes("CREATE TABLE IF NOT EXISTS feeder_tours"));

  const seedSql = generateSeedSql();
  assert.ok(seedSql.includes("INSERT INTO tenants"));
  assert.ok(seedSql.includes("DE-SIS-8921"));
  assert.ok(seedSql.includes("TENANT-COMPETITOR-XYZ"));
  assert.ok(seedSql.includes("ON CONFLICT (tenant_id) DO NOTHING"));
});
