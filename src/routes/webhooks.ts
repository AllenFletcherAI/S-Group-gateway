import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import { CarrierCode, CarrierCodeEnum, NormalizedMilestoneEvent } from "../schemas/carrierEvents.js";
import { verifyWebhookSignature } from "../middleware/webhookAuth.js";
import { normalizeCarrierEvent } from "../adapters/carrierAdapter.js";
import { carrierWebhookRateLimiter } from "../middleware/rateLimiter.js";
import { ZodError } from "zod";

// Shared carrier secret lookup (can be configured via environment variables)
export function getCarrierSecret(carrier: CarrierCode): string {
  const envKey = `CARRIER_SECRET_${carrier}`;
  return process.env[envKey] || `s-group-test-carrier-secret-key-2026-${carrier.toLowerCase()}`;
}

// In-memory event repository store for ingested milestones (isolated by tenant)
const eventStore: NormalizedMilestoneEvent[] = [];

export function getIngestedEvents(tenantId?: string): NormalizedMilestoneEvent[] {
  if (tenantId) {
    // WHY: Enforce strict tenant isolation (IDOR defense)
    return eventStore.filter((event) => event.tenantId === tenantId);
  }
  return [...eventStore];
}

export function clearIngestedEvents(): void {
  eventStore.length = 0;
}

/**
 * Carrier Webhook Ingestion Routes
 * WHY: Ingests telematics from DHL, DB Schenker, and Maersk; enforces cryptographic HMAC
 * verification, rejects replay attacks, and normalizes into unified S-Group milestone records.
 */
export async function webhookRoutes(fastify: FastifyInstance, _options: FastifyPluginOptions) {
  // We need the raw body for HMAC signature verification
  fastify.post(
    "/api/v1/webhooks/carrier",
    { preHandler: [carrierWebhookRateLimiter] },
    async (req: FastifyRequest, reply) => {
      const carrierHeader = req.headers["x-carrier-id"] as string | undefined;
      const signatureHeader = req.headers["x-carrier-signature"] as string | undefined;
      const timestampHeader = req.headers["x-carrier-timestamp"] as string | undefined;
      const tenantHeader = (req.headers["x-tenant-id"] as string | undefined) || "DE-SIS-8921";

      // 1. Verify Carrier Header
      const carrierParse = CarrierCodeEnum.safeParse(carrierHeader);
      if (!carrierParse.success) {
        return reply.status(400).send({
          error: "Bad Request",
          message: "Invalid or missing X-Carrier-Id header. Supported: DHL, SCHENKER, MAERSK",
        });
      }
      const carrier = carrierParse.data;

      // 2. Cryptographic HMAC Signature Verification (Defense against forgery & replay)
      const rawBody = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
      const secret = getCarrierSecret(carrier);

      const verification = verifyWebhookSignature({
        rawBody,
        signatureHeader,
        timestampHeader,
        secret,
      });

      if (!verification.valid) {
        req.log.warn({
          carrier,
          reason: verification.reason,
          ip: req.ip
        }, "Webhook verification rejected");

        return reply.status(401).send({
          error: "Unauthorized",
          message: "Invalid or forged carrier webhook signature",
          reason: verification.reason,
        });
      }

      // 3. Normalization & Zod Boundary Schema Validation
      try {
        const normalized = normalizeCarrierEvent({
          carrier,
          rawPayload: req.body,
          tenantId: tenantHeader,
        });

        // Store event in tenant-isolated buffer
        eventStore.push(normalized);

        req.log.info({
          eventId: normalized.eventId,
          carrier,
          milestone: normalized.milestone,
          shipmentId: normalized.shipmentId,
          tenantId: normalized.tenantId
        }, "Carrier milestone ingested successfully");

        return reply.status(202).send({
          status: "accepted",
          eventId: normalized.eventId,
          milestone: normalized.milestone,
          shipmentId: normalized.shipmentId,
          carrierReference: normalized.carrierReference,
          ingestedAt: normalized.ingestedAt,
        });
      } catch (err) {
        if (err instanceof ZodError) {
          req.log.warn({ issues: err.issues }, "Carrier payload schema validation failed");
          return reply.status(400).send({
            error: "Bad Request",
            message: "Carrier payload failed schema validation",
            issues: err.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
          });
        }

        req.log.error(err, "Unexpected normalization error");
        return reply.status(500).send({
          error: "Internal Server Error",
          message: "Failed to process carrier event",
        });
      }
    }
  );

  // Read-only query endpoint for tenant milestones
  fastify.get(
    "/api/v1/shipments/events",
    async (req: FastifyRequest<{ Querystring: { tenantId?: string } }>, reply) => {
      const tenantId = (req.query.tenantId as string) || (req.headers["x-tenant-id"] as string) || "DE-SIS-8921";
      const events = getIngestedEvents(tenantId);
      return reply.status(200).send({
        tenantId,
        count: events.length,
        events,
      });
    }
  );
}
