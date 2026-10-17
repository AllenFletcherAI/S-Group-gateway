import { CarrierCode, UnifiedMilestone, NormalizedMilestoneEvent } from "../schemas/carrierEvents.js";
import { getIngestedEvents } from "../routes/webhooks.js";

export interface CustomsDocument {
  docId: string;
  titleDe: string;
  titleEn: string;
  docType: "ATLAS_ZOLL" | "CMR_WAYBILL" | "BILL_OF_LADING" | "COMMERCIAL_INVOICE";
  fileNumber: string;
  verifiedDate: string;
  fileSizeKb: number;
}

export interface Shipment {
  shipmentId: string;
  tenantId: string;
  carrier: CarrierCode;
  trackingReference: string;
  origin: string;
  destination: string;
  cargoDescriptionDe: string;
  cargoDescriptionEn: string;
  weightKg: number;
  currentStatus: UnifiedMilestone;
  estimatedDelivery: string;
  createdAt: string;
  documents: CustomsDocument[];
}

// Initial seed records representing Schäfer & SIS Interlogistik freight operations
const SHIPMENTS_DATABASE: Shipment[] = [
  {
    shipmentId: "SHP-SIS-1049",
    tenantId: "DE-SIS-8921",
    carrier: "DHL",
    trackingReference: "DHL-HAM-992182",
    origin: "Hamburg Hafen (Terminal Altenwerder)",
    destination: "Frankfurt am Main (CargoCity Süd)",
    cargoDescriptionDe: "Präzisions-Maschinenbauteile (18 Paletten)",
    cargoDescriptionEn: "Precision Machinery Parts (18 Pallets)",
    weightKg: 8400,
    currentStatus: "PORT_ARRIVED",
    estimatedDelivery: "2026-10-20T14:00:00Z",
    createdAt: "2026-10-16T08:30:00Z",
    documents: [
      {
        docId: "DOC-ATLAS-891",
        titleDe: "ATLAS Zollanmeldung & Einfuhrabfertigung",
        titleEn: "ATLAS Customs Import Clearance",
        docType: "ATLAS_ZOLL",
        fileNumber: "DE-ATLAS-2026-881902",
        verifiedDate: "2026-10-17T11:20:00Z",
        fileSizeKb: 342,
      },
      {
        docId: "DOC-CMR-1049",
        titleDe: "Internationaler CMR-Frachtbrief",
        titleEn: "International CMR Consignment Note",
        docType: "CMR_WAYBILL",
        fileNumber: "CMR-SIS-2026-1049",
        verifiedDate: "2026-10-16T09:00:00Z",
        fileSizeKb: 185,
      }
    ]
  },
  {
    shipmentId: "SHP-SIS-2088",
    tenantId: "DE-SIS-8921",
    carrier: "SCHENKER",
    trackingReference: "SCH-FRA-77301",
    origin: "Stuttgart Industriepark",
    destination: "Rotterdam Europort",
    cargoDescriptionDe: "Automobil-Steuergeräte & Sensorik",
    cargoDescriptionEn: "Automotive Control Units & Sensors",
    weightKg: 4200,
    currentStatus: "CUSTOMS_CLEARED",
    estimatedDelivery: "2026-10-19T18:00:00Z",
    createdAt: "2026-10-15T14:15:00Z",
    documents: [
      {
        docId: "DOC-ATLAS-994",
        titleDe: "ATLAS Ausfuhrbegleitdokument (ABD)",
        titleEn: "ATLAS Export Accompanying Document",
        docType: "ATLAS_ZOLL",
        fileNumber: "DE-EXP-2026-994102",
        verifiedDate: "2026-10-16T16:45:00Z",
        fileSizeKb: 410,
      }
    ]
  },
  {
    shipmentId: "SHP-SIS-3310",
    tenantId: "DE-SIS-8921",
    carrier: "MAERSK",
    trackingReference: "MSKU8472910",
    origin: "Shanghai Deepwater Port",
    destination: "Hamburg Waltershof Terminal",
    cargoDescriptionDe: "Container 40ft High-Cube: Photovoltaik-Module",
    cargoDescriptionEn: "40ft High-Cube Container: Solar PV Modules",
    weightKg: 21800,
    currentStatus: "IN_TRANSIT",
    estimatedDelivery: "2026-10-24T06:00:00Z",
    createdAt: "2026-10-05T02:00:00Z",
    documents: [
      {
        docId: "DOC-BOL-3310",
        titleDe: "Ocean Bill of Lading (Konnossement)",
        titleEn: "Ocean Bill of Lading",
        docType: "BILL_OF_LADING",
        fileNumber: "MSK-BOL-2026-331089",
        verifiedDate: "2026-10-06T10:15:00Z",
        fileSizeKb: 520,
      }
    ]
  },
  {
    shipmentId: "SHP-OTHER-9901",
    tenantId: "TENANT-COMPETITOR-XYZ",
    carrier: "DHL",
    trackingReference: "DHL-OTHER-112233",
    origin: "Berlin Depot",
    destination: "Munich Hub",
    cargoDescriptionDe: "Vertrauliche Testfracht (Konkurrenzmandant)",
    cargoDescriptionEn: "Confidential Competitor Cargo",
    weightKg: 1500,
    currentStatus: "IN_TRANSIT",
    estimatedDelivery: "2026-10-21T12:00:00Z",
    createdAt: "2026-10-17T09:00:00Z",
    documents: []
  }
];

export interface ShipmentFilterParams {
  carrier?: string;
  status?: string;
  search?: string;
}

export interface ShipmentDetailsResult {
  shipment: Shipment;
  timeline: {
    eventId: string;
    milestone: UnifiedMilestone;
    location: string;
    timestamp: string;
    source: "INITIAL_DISPATCH" | "CARRIER_TELEMATICS";
    details?: string;
  }[];
}

/**
 * Multi-Tenant Shipment Repository
 * WHY: Enforces query-layer tenant isolation (WHERE tenant_id = :id) to prevent IDOR/BOLA,
 * and dynamically merges live ingested carrier events into an immutable chronological timeline.
 */
export class ShipmentRepository {
  /**
   * Fetch all shipments matching tenantId and optional filters
   */
  static getShipmentsByTenant(tenantId: string, filter?: ShipmentFilterParams): Shipment[] {
    // 1. Mandatory Tenant Boundary Filter
    let results = SHIPMENTS_DATABASE.filter((s) => s.tenantId === tenantId);

    if (!filter) {
      return results;
    }

    // 2. Carrier Filter
    if (filter.carrier && filter.carrier !== "ALL") {
      results = results.filter((s) => s.carrier === filter.carrier);
    }

    // 3. Status Filter
    if (filter.status && filter.status !== "ALL") {
      results = results.filter((s) => s.currentStatus === filter.status);
    }

    // 4. Text Search (Shipment ID, Tracking Ref, Cargo, Origin, Destination)
    if (filter.search) {
      const q = filter.search.toLowerCase();
      results = results.filter(
        (s) =>
          s.shipmentId.toLowerCase().includes(q) ||
          s.trackingReference.toLowerCase().includes(q) ||
          s.origin.toLowerCase().includes(q) ||
          s.destination.toLowerCase().includes(q) ||
          s.cargoDescriptionDe.toLowerCase().includes(q) ||
          s.cargoDescriptionEn.toLowerCase().includes(q)
      );
    }

    return results;
  }

  /**
   * Fetch a single shipment with dynamic merged carrier milestone timeline
   */
  static getShipmentDetails(tenantId: string, shipmentId: string): ShipmentDetailsResult | null {
    // 1. Enforce Tenant Isolation (Never fetch without tenant scoping)
    const shipment = SHIPMENTS_DATABASE.find(
      (s) => s.tenantId === tenantId && s.shipmentId === shipmentId
    );

    if (!shipment) {
      return null;
    }

    // 2. Build Timeline: Start with baseline dispatch milestone
    const timeline: ShipmentDetailsResult["timeline"] = [
      {
        eventId: `INIT-${shipment.shipmentId}`,
        milestone: "BOOKING_CREATED",
        location: shipment.origin,
        timestamp: shipment.createdAt,
        source: "INITIAL_DISPATCH",
        details: "Frachtauftrag erfasst und im S-Group Gateway disponiert",
      }
    ];

    // 3. Merge Live Ingested Carrier Webhook Milestones for this reference
    const liveEvents = getIngestedEvents(tenantId).filter(
      (ev) =>
        ev.carrierReference === shipment.trackingReference ||
        ev.shipmentId === shipment.shipmentId
    );

    for (const ev of liveEvents) {
      timeline.push({
        eventId: ev.eventId,
        milestone: ev.milestone,
        location: ev.location,
        timestamp: ev.eventTimestamp,
        source: "CARRIER_TELEMATICS",
        details: ev.details || `${ev.carrier} Telemetrie-Ereignis bestätigt`,
      });
    }

    // 4. Sort chronologically (oldest first)
    timeline.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    return {
      shipment,
      timeline,
    };
  }

  /**
   * Retrieve a customs document with tenant access verification
   */
  static getDocumentById(tenantId: string, docId: string): { document: CustomsDocument; shipment: Shipment } | null {
    const tenantShipments = this.getShipmentsByTenant(tenantId);
    for (const shipment of tenantShipments) {
      const doc = shipment.documents.find((d) => d.docId === docId);
      if (doc) {
        return { document: doc, shipment };
      }
    }
    return null;
  }
}
