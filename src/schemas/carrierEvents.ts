import { z } from "zod";

/**
 * Unified S-Group Milestone Enums
 * WHY: Standardizes heterogeneous event status codes across worldwide carriers
 * (DHL, DB Schenker, Maersk) into an unambiguous logistics status lifecycle.
 */
export const UnifiedMilestoneEnum = z.enum([
  "BOOKING_CREATED",
  "PICKED_UP",
  "PORT_ARRIVED",
  "CUSTOMS_INSPECTION",
  "CUSTOMS_CLEARED",
  "IN_TRANSIT",
  "HUB_ARRIVED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "EXCEPTION_HOLD"
]);

export type UnifiedMilestone = z.infer<typeof UnifiedMilestoneEnum>;

export const CarrierCodeEnum = z.enum(["DHL", "SCHENKER", "MAERSK"]);
export type CarrierCode = z.infer<typeof CarrierCodeEnum>;

/**
 * Raw DHL Telematics Webhook Payload Schema
 */
export const DhlWebhookSchema = z.object({
  trackingNumber: z.string().min(5).max(40),
  statusCode: z.enum(["PU", "ARR_DEP", "CST_HLD", "CST_CLR", "TR", "AR_HB", "OFD", "DLV", "EXC"]),
  timestamp: z.string().datetime({ message: "Invalid ISO-8601 datetime" }),
  facility: z.string().min(2).max(100),
  notes: z.string().optional(),
});
export type DhlWebhookPayload = z.infer<typeof DhlWebhookSchema>;

/**
 * Raw DB Schenker Webhook Payload Schema
 */
export const SchenkerWebhookSchema = z.object({
  consignmentId: z.string().min(5).max(40),
  eventCode: z.enum(["STA_01", "STA_02", "STA_03", "STA_04", "STA_05", "STA_07", "STA_09", "STA_10", "STA_99"]),
  eventDateTime: z.string().datetime({ message: "Invalid ISO-8601 datetime" }),
  terminalName: z.string().min(2).max(100),
  remarks: z.string().optional(),
});
export type SchenkerWebhookPayload = z.infer<typeof SchenkerWebhookSchema>;

/**
 * Raw Maersk Ocean Telematics Webhook Payload Schema
 */
export const MaerskWebhookSchema = z.object({
  containerNumber: z.string().regex(/^[A-Z]{4}\d{7}$/, { message: "Invalid BIC container format (e.g. MSKU1234567)" }),
  eventType: z.enum(["GATE_IN", "VESSEL_LOAD", "CUSTOMS_HOLD", "CUSTOMS_REL", "DISCHARGED", "GATE_OUT", "DELIVERED"]),
  recordedAt: z.string().datetime({ message: "Invalid ISO-8601 datetime" }),
  portCode: z.string().length(5, { message: "UN/LOCODE must be 5 chars (e.g. DEHAM)" }),
  vesselName: z.string().optional(),
});
export type MaerskWebhookPayload = z.infer<typeof MaerskWebhookSchema>;

/**
 * Standardized S-Group Normalized Event Schema
 * WHY: Strict runtime validation schema for records before storing in PostgreSQL.
 */
export const NormalizedMilestoneEventSchema = z.object({
  eventId: z.string().uuid(),
  tenantId: z.string().min(3),
  shipmentId: z.string().min(3),
  carrier: CarrierCodeEnum,
  carrierReference: z.string(),
  milestone: UnifiedMilestoneEnum,
  location: z.string(),
  eventTimestamp: z.string().datetime(),
  ingestedAt: z.string().datetime(),
  details: z.string().optional(),
});
export type NormalizedMilestoneEvent = z.infer<typeof NormalizedMilestoneEventSchema>;
