-- ==============================================================================
-- Migration: V005__api_keys_and_credentials.sql
-- Description: Scoped API Keys, Principal Directory & RBAC Security (D-010)
-- S-Group Gateway | Schäfer & SIS Interlogistik
-- ==============================================================================

CREATE TABLE IF NOT EXISTS api_keys (
    api_key_id VARCHAR(64) PRIMARY KEY,
    hashed_key VARCHAR(64) NOT NULL UNIQUE, -- SHA-256 hash digest
    principal_id VARCHAR(64) NOT NULL,
    tenant_id VARCHAR(64) NOT NULL REFERENCES tenants(tenant_id) ON DELETE RESTRICT,
    role VARCHAR(32) NOT NULL, -- CUSTOMER_VIEWER, DISPATCHER, COMPLIANCE_OFFICER, INTEGRATION_SYSTEM
    scopes JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of permission scopes
    description VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_api_keys_hashed 
    ON api_keys (hashed_key);

CREATE INDEX IF NOT EXISTS idx_api_keys_tenant 
    ON api_keys (tenant_id, is_active);
