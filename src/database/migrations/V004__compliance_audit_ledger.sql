-- ==============================================================================
-- Migration: V004__compliance_audit_ledger.sql
-- Description: Immutable German Privacy (DSGVO Art. 5) Audit Ledger (D-010)
-- S-Group Gateway | Schäfer & SIS Interlogistik
-- ==============================================================================

CREATE TABLE IF NOT EXISTS compliance_prune_ledger (
    sweep_id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL REFERENCES tenants(tenant_id) ON DELETE RESTRICT,
    executed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    retention_cutoff TIMESTAMPTZ NOT NULL,
    records_evaluated INTEGER NOT NULL CHECK (records_evaluated >= 0),
    records_purged INTEGER NOT NULL CHECK (records_purged >= 0),
    status VARCHAR(32) NOT NULL DEFAULT 'COMPLETED',
    audit_hash VARCHAR(64) NOT NULL -- SHA-256 cryptographic verification checksum
);

CREATE INDEX IF NOT EXISTS idx_prune_ledger_tenant_date 
    ON compliance_prune_ledger (tenant_id, executed_at DESC);
