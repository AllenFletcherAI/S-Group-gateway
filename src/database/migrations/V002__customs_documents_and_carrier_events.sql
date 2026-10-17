-- ==============================================================================
-- Migration: V002__customs_documents_and_carrier_events.sql
-- Description: Customs Archive and Time-Series Ingested Carrier Events (D-010)
-- S-Group Gateway | Schäfer & SIS Interlogistik
-- ==============================================================================

-- 1. Customs Documents Archive Table
CREATE TABLE IF NOT EXISTS customs_documents (
    doc_id VARCHAR(64) PRIMARY KEY,
    shipment_id VARCHAR(64) NOT NULL REFERENCES shipments(shipment_id) ON DELETE CASCADE,
    tenant_id VARCHAR(64) NOT NULL REFERENCES tenants(tenant_id) ON DELETE RESTRICT,
    doc_type VARCHAR(32) NOT NULL, -- ATLAS_ZOLL, CMR_WAYBILL, BILL_OF_LADING, etc.
    title_de VARCHAR(255) NOT NULL,
    title_en VARCHAR(255) NOT NULL,
    file_number VARCHAR(128) NOT NULL,
    verified_date TIMESTAMPTZ NOT NULL,
    file_size_kb INTEGER NOT NULL CHECK (file_size_kb > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_customs_tenant_shipment 
    ON customs_documents (tenant_id, shipment_id);

-- 2. Time-Series Carrier Telematics & Milestone Events Table
CREATE TABLE IF NOT EXISTS carrier_events (
    event_id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL REFERENCES tenants(tenant_id) ON DELETE RESTRICT,
    shipment_id VARCHAR(64) NOT NULL,
    carrier_code VARCHAR(32) NOT NULL,
    raw_event_code VARCHAR(64) NOT NULL,
    normalized_milestone VARCHAR(64) NOT NULL,
    location VARCHAR(255) NOT NULL,
    latitude NUMERIC(9, 6),
    longitude NUMERIC(9, 6),
    timestamp TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Chronological Timeline Queries Index
CREATE INDEX IF NOT EXISTS idx_carrier_events_timeline 
    ON carrier_events (tenant_id, shipment_id, timestamp ASC);

-- 90-Day German Privacy Retention Sweeper Index (DSGVO Art. 5)
CREATE INDEX IF NOT EXISTS idx_carrier_events_retention 
    ON carrier_events (timestamp);
