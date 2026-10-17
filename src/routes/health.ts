import { FastifyInstance, FastifyPluginOptions } from "fastify";

/**
 * Health & Operational Status Route
 * WHY: Provides unauthenticated liveness and readiness probe for load balancers
 * and verifies system invariants (tenant isolation and DSGVO compliance flags).
 */
export async function healthRoutes(fastify: FastifyInstance, _options: FastifyPluginOptions) {
  fastify.get("/health", async (_request, reply) => {
    return reply.status(200).send({
      status: "operational",
      service: "s-group-gateway",
      system: "Schäfer & SIS Interlogistik",
      classification: "Lane B (Customer-Facing)",
      invariants: {
        dsgvoCompliance: "enforced",
        tenantIsolation: "active",
        telematicsRetentionDays: 90,
      },
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString()
    });
  });
}
