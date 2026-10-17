import crypto from "crypto";
import {
  CarrierCode,
  DhlWebhookSchema,
  SchenkerWebhookSchema,
  MaerskWebhookSchema,
  NormalizedMilestoneEvent,
  NormalizedMilestoneEventSchema,
  UnifiedMilestone
} from "../schemas/carrierEvents.js";

/**
 * DHL Event Code Mapping Table
 */
const DHL_EVENT_MAP: Record<string, UnifiedMilestone> = {
  PU: "PICKED_UP",
  ARR_DEP: "PORT_ARRIVED",
  CST_HLD: "CUSTOMS_INSPECTION",
  CST_CLR: "CUSTOMS_CLEARED",
  TR: "IN_TRANSIT",
  AR_HB: "HUB_ARRIVED",
  OFD: "OUT_FOR_DELIVERY",
  DLV: "DELIVERED",
  EXC: "EXCEPTION_HOLD",
};

/**
 * DB Schenker Event Code Mapping Table
 */
const SCHENKER_EVENT_MAP: Record<string, UnifiedMilestone> = {
  STA_01: "PICKED_UP",
  STA_02: "IN_TRANSIT",
  STA_03: "PORT_ARRIVED",
  STA_04: "CUSTOMS_CLEARED",
  STA_05: "CUSTOMS_INSPECTION",
  STA_07: "HUB_ARRIVED",
  STA_09: "OUT_FOR_DELIVERY",
  STA_10: "DELIVERED",
  STA_99: "EXCEPTION_HOLD",
};

/**
 * Maersk Event Code Mapping Table
 */
const MAERSK_EVENT_MAP: Record<string, UnifiedMilestone> = {
  GATE_IN: "PORT_ARRIVED",
  VESSEL_LOAD: "IN_TRANSIT",
  CUSTOMS_HOLD: "CUSTOMS_INSPECTION",
  CUSTOMS_REL: "CUSTOMS_CLEARED",
  DISCHARGED: "HUB_ARRIVED",
  GATE_OUT: "OUT_FOR_DELIVERY",
  DELIVERED: "DELIVERED",
};

export interface NormalizationParams {
  carrier: CarrierCode;
  rawPayload: unknown;
  tenantId: string;
  shipmentIdMap?: Record<string, string>; // Maps carrier tracking numbers to internal shipment IDs
}

/**
 * Carrier Normalization Adapter
 * WHY: Translates divergent carrier schemas and proprietary event codes into unified,
 * strictly validated S-Group milestone models.
 */
export function normalizeCarrierEvent(params: NormalizationParams): NormalizedMilestoneEvent {
  const { carrier, rawPayload, tenantId } = params;
  const now = new Date().toISOString();
  const eventId = crypto.randomUUID();

  let carrierReference: string;
  let milestone: UnifiedMilestone;
  let location: string;
  let eventTimestamp: string;
  let details: string | undefined;

  switch (carrier) {
    case "DHL": {
      const dhl = DhlWebhookSchema.parse(rawPayload);
      carrierReference = dhl.trackingNumber;
      milestone = DHL_EVENT_MAP[dhl.statusCode] || "IN_TRANSIT";
      location = dhl.facility;
      eventTimestamp = dhl.timestamp;
      details = dhl.notes ? `DHL Note: ${dhl.notes}` : undefined;
      break;
    }
    case "SCHENKER": {
      const schenker = SchenkerWebhookSchema.parse(rawPayload);
      carrierReference = schenker.consignmentId;
      milestone = SCHENKER_EVENT_MAP[schenker.eventCode] || "IN_TRANSIT";
      location = schenker.terminalName;
      eventTimestamp = schenker.eventDateTime;
      details = schenker.remarks ? `Schenker Status: ${schenker.remarks}` : undefined;
      break;
    }
    case "MAERSK": {
      const maersk = MaerskWebhookSchema.parse(rawPayload);
      carrierReference = maersk.containerNumber;
      milestone = MAERSK_EVENT_MAP[maersk.eventType] || "IN_TRANSIT";
      location = maersk.portCode;
      eventTimestamp = maersk.recordedAt;
      details = maersk.vesselName ? `Vessel: ${maersk.vesselName}` : undefined;
      break;
    }
    default: {
      throw new Error(`Unsupported carrier code: ${carrier}`);
    }
  }

  // Synthesize or map internal shipment identifier
  const shipmentId = params.shipmentIdMap?.[carrierReference] || `SHP-${carrierReference}`;

  const normalized: NormalizedMilestoneEvent = {
    eventId,
    tenantId,
    shipmentId,
    carrier,
    carrierReference,
    milestone,
    location,
    eventTimestamp,
    ingestedAt: now,
    details,
  };

  return NormalizedMilestoneEventSchema.parse(normalized);
}
