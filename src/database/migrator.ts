import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface MigrationFile {
  version: string;
  name: string;
  fileName: string;
  filePath: string;
  sqlContent: string;
  checksum: string;
}

export interface MigrationExecutionResult {
  version: string;
  name: string;
  checksum: string;
  status: "APPLIED" | "ALREADY_APPLIED" | "VERIFIED";
  statementsCount: number;
}

/**
 * Migration Manager for S-Group Gateway PostgreSQL Schemas
 * WHY: Delivers versioned, checksummed, and idempotent DDL migrations (D-010).
 */
export class DatabaseMigrator {
  private static migrationsDir = path.join(__dirname, "migrations");

  /**
   * Set custom migrations directory (useful for testing or build directories)
   */
  static setMigrationsDir(dir: string): void {
    this.migrationsDir = dir;
  }

  /**
   * Load and parse all SQL migration files sorted sequentially by version
   */
  static loadMigrationFiles(): MigrationFile[] {
    if (!fs.existsSync(this.migrationsDir)) {
      throw new Error(`Migrations directory not found at: ${this.migrationsDir}`);
    }

    const files = fs.readdirSync(this.migrationsDir).filter((f) => f.endsWith(".sql"));

    const migrations: MigrationFile[] = files.map((fileName) => {
      const filePath = path.join(this.migrationsDir, fileName);
      const sqlContent = fs.readFileSync(filePath, "utf8");
      const checksum = crypto.createHash("sha256").update(sqlContent, "utf8").digest("hex");

      // Extract version: e.g. V001__init_tenants_and_shipments.sql -> version = V001
      const match = fileName.match(/^(V\d+)__(.+)\.sql$/);
      if (!match) {
        throw new Error(`Invalid migration file naming convention: ${fileName}. Must follow V<number>__<name>.sql`);
      }

      const version = match[1];
      const name = match[2];

      return {
        version,
        name,
        fileName,
        filePath,
        sqlContent,
        checksum,
      };
    });

    // Sort migrations sequentially by version number (e.g. V001, V002, V003...)
    migrations.sort((a, b) => a.version.localeCompare(b.version, undefined, { numeric: true }));

    return migrations;
  }

  /**
   * Validate SQL statements and verify migration integrity
   */
  static verifyMigrations(): MigrationExecutionResult[] {
    const migrations = this.loadMigrationFiles();
    const results: MigrationExecutionResult[] = [];

    for (const mig of migrations) {
      // Split into discrete SQL statements (ignoring comments and empty lines)
      const cleanSql = mig.sqlContent
        .replace(/--.*$/gm, "") // remove comments
        .trim();

      const statements = cleanSql
        .split(";")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      if (statements.length === 0) {
        throw new Error(`Migration ${mig.fileName} contains no valid SQL statements`);
      }

      results.push({
        version: mig.version,
        name: mig.name,
        checksum: mig.checksum,
        status: "VERIFIED",
        statementsCount: statements.length,
      });
    }

    return results;
  }

  /**
   * Generate combined DDL script for full schema deployment or database bootstrap
   */
  static generateConsolidatedSchema(): string {
    const migrations = this.loadMigrationFiles();
    const header = `-- ==============================================================================
-- S-Group Gateway Consolidated Production Schema (Schäfer & SIS Interlogistik)
-- Generated: ${new Date().toISOString()}
-- ==============================================================================

`;
    return header + migrations.map((m) => `-- Migration: ${m.fileName}\n${m.sqlContent}`).join("\n\n");
  }
}
