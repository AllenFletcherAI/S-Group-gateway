import { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from "fastify";
import { DispatchRepository, TourFilterParams } from "../repositories/dispatch.js";
import { apiQueryRateLimiter } from "../middleware/rateLimiter.js";
import { z } from "zod";

interface TourQuery extends TourFilterParams {
  tenantId?: string;
}

interface TourParams {
  id: string;
}

const AssignShipmentSchema = z.object({
  shipmentId: z.string().min(3),
  pallets: z.number().int().positive().max(66),
  weightKg: z.number().positive().max(50000),
});

export async function dispatchRoutes(fastify: FastifyInstance, _options: FastifyPluginOptions) {
  const DEFAULT_TENANT = "DE-SIS-8921";

  // Rate limiting applied to dispatch API queries
  fastify.addHook("preHandler", apiQueryRateLimiter);

  // 1. List tours for tenant
  fastify.get(
    "/api/v1/dispatch/tours",
    async (req: FastifyRequest<{ Querystring: TourQuery }>, reply: FastifyReply) => {
      const tenantId =
        (req.headers["x-tenant-id"] as string) ||
        req.query.tenantId ||
        DEFAULT_TENANT;

      const tours = DispatchRepository.getToursByTenant(tenantId, {
        status: req.query.status,
        mode: req.query.mode,
        search: req.query.search,
      });

      return reply.status(200).send({
        tenantId,
        count: tours.length,
        tours,
      });
    }
  );

  // 2. Get single tour with tenant scoping
  fastify.get(
    "/api/v1/dispatch/tours/:id",
    async (req: FastifyRequest<{ Params: TourParams; Querystring: TourQuery }>, reply: FastifyReply) => {
      const tenantId =
        (req.headers["x-tenant-id"] as string) ||
        req.query.tenantId ||
        DEFAULT_TENANT;

      const tour = DispatchRepository.getTourById(tenantId, req.params.id);
      if (!tour) {
        return reply.status(404).send({
          statusCode: 404,
          error: "Not Found",
          message: `Feeder tour ${req.params.id} not found or unauthorized for tenant ${tenantId}`,
        });
      }

      return reply.status(200).send({ tour });
    }
  );

  // 3. Assign shipment to tour with capacity boundary validation
  fastify.post(
    "/api/v1/dispatch/tours/:id/assign",
    async (req: FastifyRequest<{ Params: TourParams; Body: unknown }>, reply: FastifyReply) => {
      const tenantId =
        (req.headers["x-tenant-id"] as string) || DEFAULT_TENANT;

      const parsedBody = AssignShipmentSchema.safeParse(req.body);
      if (!parsedBody.success) {
        return reply.status(400).send({
          statusCode: 400,
          error: "Bad Request",
          message: "Invalid shipment assignment payload",
          issues: parsedBody.error.issues,
        });
      }

      const { shipmentId, pallets, weightKg } = parsedBody.data;
      const result = DispatchRepository.assignShipmentToTour(
        tenantId,
        req.params.id,
        shipmentId,
        pallets,
        weightKg
      );

      if (!result.success) {
        return reply.status(400).send({
          statusCode: 400,
          error: "Capacity Overload",
          message: result.error,
        });
      }

      return reply.status(200).send({
        success: true,
        message: `Shipment ${shipmentId} successfully assigned to tour ${req.params.id}`,
        tour: result.tour,
      });
    }
  );
}
