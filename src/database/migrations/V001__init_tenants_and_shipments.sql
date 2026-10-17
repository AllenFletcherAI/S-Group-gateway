-- ==============================================================================
-- Migration: V001__init_tenants_and_shipments.sql
-- Description: Core Multi-Tenant Platform Schema & Relational Shipments (D-010)
-- S-Group Gateway | Schäfer & SIS Interlogistik
-- ==============================================================================

-- 1. Schema Migrations Ledger Table
CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(32) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    checksum VARCHAR(64) NOT NULL
);

-- 2. Tenants Table (Strict Tenant Isolation Anchor)
CREATE TABLE IF NOT EXISTS tenants (
    tenant_id VARCHAR(64) PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    country_code VARCHAR(2) NOT NULL DEFAULT 'DE',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. Shipments Table
CREATE TABLE IF NOT EXISTS shipments (
    shipment_id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL REFERENCES tenants(tenant_id) ON DELETE RESTRICT,
    carrier_code VARCHAR(32) NOT NULL,
    tracking_reference VARCHAR(128) NOT NULL,
    origin VARCHAR(255) NOT NULL,
    destination VARCHAR(255) NOT NULL,
    cargo_description_de TEXT NOT NULL,
    cargo_description_en TEXT NOT NULL,
    weight_kg NUMERIC(10, 2) NOT NULL CHECK (weight_kg > 0),
    current_status VARCHAR(64) NOT NULL,
    estimated_delivery TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Composite B-Tree Indexes for Sub-Millisecond Multi-Tenant Filtering
CREATE INDEX IF NOT EXISTS idx_shipments_tenant_created 
    ON shipments (tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_shipments_tenant_status 
    ON shipments (tenant_id, current_status);

CREATE INDEX IF NOT EXISTS idx_shipments_carrier_ref 
    ON shipments (carrier_code, tracking_reference);
