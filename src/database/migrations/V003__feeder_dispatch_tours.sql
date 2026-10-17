-- ==============================================================================
-- Migration: V003__feeder_dispatch_tours.sql
-- Description: Multi-Modal Feeder Tours, ADR Safety & Vehicle Capacity Bounds (D-010)
-- S-Group Gateway | Schäfer & SIS Interlogistik
-- ==============================================================================

-- 1. Feeder Tours Table
CREATE TABLE IF NOT EXISTS feeder_tours (
    tour_id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL REFERENCES tenants(tenant_id) ON DELETE RESTRICT,
    tour_title_de VARCHAR(255) NOT NULL,
    tour_title_en VARCHAR(255) NOT NULL,
    transport_mode VARCHAR(32) NOT NULL, -- ROAD_FEEDER, RAIL_INTERMODAL, BARGE_INLAND
    corridor VARCHAR(255) NOT NULL,
    origin VARCHAR(255) NOT NULL,
    destination VARCHAR(255) NOT NULL,
    vehicle_identifier VARCHAR(128) NOT NULL,
    driver_pseudonym VARCHAR(64) NOT NULL, -- DSGVO worker pseudonym token
    departure_time TIMESTAMPTZ NOT NULL,
    estimated_arrival TIMESTAMPTZ NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'PLANNED',
    max_pallets INTEGER NOT NULL CHECK (max_pallets > 0),
    loaded_pallets INTEGER NOT NULL DEFAULT 0,
    max_weight_kg NUMERIC(10, 2) NOT NULL CHECK (max_weight_kg > 0),
    loaded_weight_kg NUMERIC(10, 2) NOT NULL DEFAULT 0,
    adr_hazardous_class VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Physical Vehicle Capacity Bounds Enforced Directly in SQL Engine
    CONSTRAINT check_pallet_capacity CHECK (loaded_pallets >= 0 AND loaded_pallets <= max_pallets),
    CONSTRAINT check_weight_capacity CHECK (loaded_weight_kg >= 0 AND loaded_weight_kg <= max_weight_kg)
);

CREATE INDEX IF NOT EXISTS idx_feeder_tours_tenant_status 
    ON feeder_tours (tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_feeder_tours_mode 
    ON feeder_tours (transport_mode);

-- 2. Tour Assigned Shipments Junction Table
CREATE TABLE IF NOT EXISTS tour_assigned_shipments (
    tour_id VARCHAR(64) NOT NULL REFERENCES feeder_tours(tour_id) ON DELETE CASCADE,
    shipment_id VARCHAR(64) NOT NULL,
    tenant_id VARCHAR(64) NOT NULL REFERENCES tenants(tenant_id) ON DELETE RESTRICT,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (tour_id, shipment_id)
);

CREATE INDEX IF NOT EXISTS idx_assigned_shipments_tour 
    ON tour_assigned_shipments (tour_id);
