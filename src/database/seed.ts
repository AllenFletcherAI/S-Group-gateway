/**
 * S-Group Gateway Production Seed Data Generator
 * WHY: Generates idempotent SQL seed fixtures for initial enterprise deployment (D-010).
 */
export function generateSeedSql(): string {
  return `-- ==============================================================================
-- S-Group Gateway Production Seed Fixtures (Schäfer & SIS Interlogistik)
-- ==============================================================================

-- 1. Seed Tenants
INSERT INTO tenants (tenant_id, company_name, country_code, is_active)
VALUES 
    ('DE-SIS-8921', 'Schäfer & SIS Interlogistik GmbH', 'DE', TRUE),
    ('TENANT-COMPETITOR-XYZ', 'Competitor Logistics AG', 'DE', TRUE)
ON CONFLICT (tenant_id) DO NOTHING;

-- 2. Seed Shipments
INSERT INTO shipments (
    shipment_id, tenant_id, carrier_code, tracking_reference, origin, destination,
    cargo_description_de, cargo_description_en, weight_kg, current_status, estimated_delivery, created_at
)
VALUES 
    ('SHP-SIS-1049', 'DE-SIS-8921', 'DHL', 'DHL-HAM-992182', 'Hamburg Hafen (Terminal Altenwerder)', 'Frankfurt am Main (CargoCity Süd)', 'Präzisions-Maschinenbauteile (18 Paletten)', 'Precision Machinery Parts (18 Pallets)', 8400.00, 'PORT_ARRIVED', '2026-10-20T14:00:00Z', '2026-10-16T08:30:00Z'),
    ('SHP-SIS-2088', 'DE-SIS-8921', 'SCHENKER', 'SCH-FRA-77301', 'Stuttgart Industriepark', 'Rotterdam Europort (Terminal Delta)', 'Automobil-Elektronik & Halbleiter (12 Paletten)', 'Automotive Electronics & Semiconductors (12 Pallets)', 4200.00, 'CUSTOMS_CLEARED', '2026-10-19T18:00:00Z', '2026-10-17T06:00:00Z'),
    ('SHP-SIS-3310', 'DE-SIS-8921', 'MAERSK', 'MSK-992014-X', 'Shanghai Port (Yangshan Deepwater)', 'Hamburg Hafen (Waltershof Terminal)', 'Photovoltaik-Module & Wechselrichter (44 Paletten)', 'Photovoltaic Modules & Inverters (44 Pallets)', 21800.00, 'IN_TRANSIT', '2026-10-24T06:00:00Z', '2026-10-05T02:00:00Z'),
    ('SHP-OTHER-9901', 'TENANT-COMPETITOR-XYZ', 'DHL', 'DHL-OTHER-112233', 'Berlin Depot', 'Munich Hub', 'Vertrauliche Testfracht (Konkurrenzmandant)', 'Confidential Competitor Cargo', 1500.00, 'IN_TRANSIT', '2026-10-21T12:00:00Z', '2026-10-17T09:00:00Z')
ON CONFLICT (shipment_id) DO NOTHING;

-- 3. Seed Customs Documents
INSERT INTO customs_documents (
    doc_id, shipment_id, tenant_id, doc_type, title_de, title_en, file_number, verified_date, file_size_kb
)
VALUES 
    ('DOC-ATLAS-891', 'SHP-SIS-1049', 'DE-SIS-8921', 'ATLAS_ZOLL', 'ATLAS Zollanmeldung & Einfuhrabfertigung', 'ATLAS Customs Import Clearance', 'DE-ATLAS-2026-881902', '2026-10-17T11:20:00Z', 342),
    ('DOC-CMR-1049', 'SHP-SIS-1049', 'DE-SIS-8921', 'CMR_WAYBILL', 'Internationaler CMR-Frachtbrief', 'International CMR Consignment Note', 'CMR-SIS-2026-1049', '2026-10-16T09:00:00Z', 188),
    ('DOC-CMR-2088', 'SHP-SIS-2088', 'DE-SIS-8921', 'CMR_WAYBILL', 'CMR Frachtbrief Gefahrgut-Deklaration', 'CMR Hazardous Cargo Waybill', 'CMR-SCH-2026-2088', '2026-10-17T07:15:00Z', 215),
    ('DOC-BOL-3310', 'SHP-SIS-3310', 'DE-SIS-8921', 'BILL_OF_LADING', 'Ocean Bill of Lading (Konnossement)', 'Ocean Bill of Lading', 'MSK-BOL-2026-331089', '2026-10-06T10:15:00Z', 520)
ON CONFLICT (doc_id) DO NOTHING;

-- 4. Seed Feeder Tours
INSERT INTO feeder_tours (
    tour_id, tenant_id, tour_title_de, tour_title_en, transport_mode, corridor, origin, destination,
    vehicle_identifier, driver_pseudonym, departure_time, estimated_arrival, status,
    max_pallets, loaded_pallets, max_weight_kg, loaded_weight_kg, adr_hazardous_class
)
VALUES 
    ('TOUR-HAM-01', 'DE-SIS-8921', 'Hauptlauf Nord-Süd A7/A5 (Seehafen-Zubringer)', 'North-South Mainline A7/A5 (Seaport Feeder)', 'ROAD_FEEDER', 'Hamburg Hafen ➔ Frankfurt CargoCity Süd', 'Hamburg Hafen (Terminal Altenwerder)', 'Frankfurt am Main (CargoCity Süd)', 'LKW-HAM-491 (Euro-6 Sattelzug)', 'Fahrer-ID: DRV-HAM-491', '2026-10-18T22:00:00Z', '2026-10-20T14:00:00Z', 'EN_ROUTE', 24, 18, 18000.00, 8400.00, NULL),
    ('TOUR-STR-04', 'DE-SIS-8921', 'Rhein-Alpen Westzubringer (A61/A15)', 'Rhine-Alpine Feeder (A61/A15)', 'ROAD_FEEDER', 'Stuttgart Industriepark ➔ Rotterdam Europort', 'Stuttgart Industriepark', 'Rotterdam Europort', 'LKW-STR-882 (Mega-Trailer)', 'Fahrer-ID: DRV-STR-882', '2026-10-18T18:30:00Z', '2026-10-19T18:00:00Z', 'EN_ROUTE', 24, 12, 18000.00, 4200.00, NULL),
    ('TOUR-RTM-09', 'DE-SIS-8921', 'Intermodaler Güterbahn-Shuttle (Seehafen Rotterdam – Rhein-Ruhr)', 'Intermodal Rail Freight Shuttle (Rotterdam – Rhine-Ruhr)', 'RAIL_INTERMODAL', 'Rotterdam Maasvlakte ➔ Duisburg Gateway Terminal', 'Rotterdam Maasvlakte Terminal', 'Duisburg Gateway Terminal', 'Zug-RTM-112 (E-Lok BR 189 / 22 Waggons)', 'Tf-ID: TF-RTM-912', '2026-10-19T04:00:00Z', '2026-10-19T12:00:00Z', 'PLANNED', 66, 44, 65000.00, 38200.00, 'ADR Klasse 9: Verschiedene gefährliche Stoffe (Photovoltaik/Batterien)'),
    ('TOUR-FRA-12', 'DE-SIS-8921', 'Zubringer Süd A3 (Flughafen Frankfurt – Bayern Hub)', 'Feeder South A3 (Frankfurt Airport – Bavaria Hub)', 'ROAD_FEEDER', 'Frankfurt am Main ➔ Nürnberg Güterverkehrszentrum', 'Frankfurt CargoCity Süd', 'Nürnberg GVZ', 'LKW-FRA-301 (Planenauflieger)', 'Fahrer-ID: DRV-FRA-301', '2026-10-20T06:00:00Z', '2026-10-20T11:30:00Z', 'PLANNED', 24, 0, 18000.00, 0.00, NULL),
    ('TOUR-COMPETITOR-99', 'TENANT-COMPETITOR-XYZ', 'Vertrauliche Konkurrenz-Tour', 'Confidential Competitor Tour', 'ROAD_FEEDER', 'Berlin ➔ Leipzig', 'Berlin Hub', 'Leipzig Hub', 'LKW-BER-99', 'DRV-99', '2026-10-18T10:00:00Z', '2026-10-18T14:00:00Z', 'PLANNED', 24, 10, 18000.00, 5000.00, NULL)
ON CONFLICT (tour_id) DO NOTHING;

-- 5. Seed Tour Assigned Shipments
INSERT INTO tour_assigned_shipments (tour_id, shipment_id, tenant_id)
VALUES 
    ('TOUR-HAM-01', 'SHP-SIS-1049', 'DE-SIS-8921'),
    ('TOUR-STR-04', 'SHP-SIS-2088', 'DE-SIS-8921'),
    ('TOUR-RTM-09', 'SHP-SIS-3310', 'DE-SIS-8921')
ON CONFLICT (tour_id, shipment_id) DO NOTHING;

-- 6. Seed Compliance Pruning Ledger
INSERT INTO compliance_prune_ledger (
    sweep_id, tenant_id, executed_at, retention_cutoff, records_evaluated, records_purged, status, audit_hash
)
VALUES 
    ('SWEEP-2026-10-18-001', 'DE-SIS-8921', '2026-10-18T00:00:00Z', '2026-07-20T00:00:00Z', 12450, 4120, 'COMPLETED', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855')
ON CONFLICT (sweep_id) DO NOTHING;

-- 7. Seed Enterprise API Keys
INSERT INTO api_keys (
    api_key_id, hashed_key, principal_id, tenant_id, role, scopes, description
)
VALUES 
    ('KEY-BMW-01', 'e2d1d283c74900c3b88950893a9c7b65c3bb9dcdaefc0b89b4f0b784cb13d9e8', 'USR-BMW-001', 'DE-SIS-8921', 'CUSTOMER_VIEWER', '["shipments:read"]'::jsonb, 'Enterprise Customer Read-Only Viewer (BMW Logistics Desk)'),
    ('KEY-DISP-01', 'a194562095f32b85a1a19f408cf5839ff9142f9b88234199c9d5dfb28bf9e023', 'DISP-SIS-442', 'DE-SIS-8921', 'DISPATCHER', '["shipments:read", "shipments:write", "dispatch:manage"]'::jsonb, 'Senior Feeder Tour Dispatcher (Schäfer & SIS Interlogistik)'),
    ('KEY-DPO-01', '7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069', 'DPO-GER-801', 'DE-SIS-8921', 'COMPLIANCE_OFFICER', '["shipments:read", "compliance:audit"]'::jsonb, 'German DSGVO Data Protection & Audit Officer'),
    ('KEY-MASTER-01', '3d5b06a5b28d73b22cf337f7663e00cf05c754668270e5b7b960bc210bf97a1d', 'SYS-ADMIN-001', 'DE-SIS-8921', 'INTEGRATION_SYSTEM', '["shipments:read", "shipments:write", "dispatch:manage", "compliance:audit", "webhooks:publish"]'::jsonb, 'Master Automation Gateway & ERP Service Account')
ON CONFLICT (api_key_id) DO NOTHING;
`;
}
