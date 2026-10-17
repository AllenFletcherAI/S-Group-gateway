import { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from "fastify";
import { TelematicsPrunerService } from "../services/telematicsPruner.js";
import { compliancePruningRateLimiter } from "../middleware/rateLimiter.js";

interface ComplianceQuery {
  tenantId?: string;
  download?: string;
}

interface PruneBody {
  tenantId?: string;
  dryRun?: boolean;
}

export async function complianceRoutes(fastify: FastifyInstance, _options: FastifyPluginOptions) {
  const DEFAULT_TENANT = "DE-SIS-8921";

  // 1. Export Full Tenant Data Package (DSGVO Art. 15 Right of Access)
  fastify.get("/api/v1/compliance/export", async (req: FastifyRequest<{ Querystring: ComplianceQuery }>, reply: FastifyReply) => {
    const tenantId = req.query.tenantId || DEFAULT_TENANT;
    const pkg = TelematicsPrunerService.generateTenantExport(tenantId);

    if (req.query.download === "true") {
      reply.header("content-disposition", `attachment; filename="dsgvo-art15-export-${tenantId}.json"`);
    }

    return reply.type("application/json").send(pkg);
  });

  // 2. Fetch Pruning Audit Ledger
  fastify.get("/api/v1/compliance/ledger", async (req: FastifyRequest<{ Querystring: ComplianceQuery }>, reply: FastifyReply) => {
    const tenantId = req.query.tenantId || DEFAULT_TENANT;
    const ledger = TelematicsPrunerService.getPruningLedger(tenantId);
    return reply.send({
      tenantId,
      retentionPolicyDays: 90,
      legalBasis: "DSGVO Art. 5(1)(e)",
      count: ledger.length,
      ledger
    });
  });

  // 3. Trigger or Dry-Run 90-Day Telematics Pruning Sweep
  fastify.post<{ Body?: PruneBody }>(
    "/api/v1/compliance/prune",
    { preHandler: [compliancePruningRateLimiter] },
    async (req, reply: FastifyReply) => {
    const tenantId = req.body?.tenantId || DEFAULT_TENANT;
    const isDryRun = Boolean(req.body?.dryRun);

    const sweepResult = TelematicsPrunerService.executeSweep(tenantId, isDryRun);

    return reply.status(200).send({
      success: true,
      mode: isDryRun ? "DRY_RUN" : "LIVE_PURGE",
      sweep: sweepResult,
      notice: "Raw driver GPS coordinates older than 90 days pruned; macro-milestones preserved per German DSGVO Art. 5."
    });
  });
}
