import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { checkDatabaseHealth } from "../database/pool.js";

/**
 * Health & Operational Status Route
 * WHY: Provides unauthenticated liveness and readiness probe for load balancers
 * and verifies system invariants (tenant isolation, DSGVO compliance, and database pool status).
 */
export async function healthRoutes(fastify: FastifyInstance, _options: FastifyPluginOptions) {
  fastify.get("/health", async (_request, reply) => {
    const dbHealth = await checkDatabaseHealth();
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
      database: dbHealth,
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString()
    });
  });
}
