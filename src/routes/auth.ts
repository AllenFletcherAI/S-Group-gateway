import { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from "fastify";
import {
  findPrincipalByApiKey,
  signJwtToken,
  requireAuth,
  AuthPrincipal,
} from "../middleware/auth.js";
import { apiQueryRateLimiter } from "../middleware/rateLimiter.js";
import { z } from "zod";

const TokenRequestSchema = z.object({
  apiKey: z.string().min(5),
  expiresInSeconds: z.number().int().positive().max(86400).optional(),
});

/**
 * Authentication & Session Management Routes
 * WHY: Provides standard endpoints for token exchange, session inspection,
 * and scoped credential verification (D-009).
 */
export async function authRoutes(fastify: FastifyInstance, _options: FastifyPluginOptions) {
  // Apply rate limiter to auth endpoints
  fastify.addHook("preHandler", apiQueryRateLimiter);

  // 1. Token Exchange: Exchange API Key for signed session JWT
  fastify.post(
    "/api/v1/auth/token",
    async (req: FastifyRequest<{ Body: unknown }>, reply: FastifyReply) => {
      const parsed = TokenRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.status(400).send({
          statusCode: 400,
          error: "Bad Request",
          message: "Invalid token request payload",
          issues: parsed.error.issues,
        });
      }

      const { apiKey, expiresInSeconds = 3600 } = parsed.data;
      const principal = findPrincipalByApiKey(apiKey);

      if (!principal) {
        return reply.status(401).send({
          statusCode: 401,
          error: "Unauthorized",
          message: "Invalid API key",
        });
      }

      const token = signJwtToken(principal, expiresInSeconds);

      return reply.status(200).send({
        tokenType: "Bearer",
        accessToken: token,
        expiresInSeconds,
        principal: {
          principalId: principal.principalId,
          tenantId: principal.tenantId,
          role: principal.role,
          scopes: principal.scopes,
        },
      });
    }
  );

  // 2. WhoAmI: Inspect authenticated principal profile & scopes
  fastify.get(
    "/api/v1/auth/me",
    { preHandler: [requireAuth()] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const principal = (req as any).principal as AuthPrincipal;
      return reply.status(200).send({
        authenticated: true,
        principal,
      });
    }
  );

  // 3. Demo API Key Directory (Safe metadata directory for testing & portal onboarding)
  fastify.get("/api/v1/auth/demo-keys", async (_req, reply) => {
    return reply.status(200).send({
      message: "Pre-seeded S-Group Gateway test credentials for development & verification",
      keys: [
        {
          keyPrefix: "sg_live_customer_bmw",
          role: "CUSTOMER_VIEWER",
          tenantId: "DE-SIS-8921",
          scopes: ["shipments:read"],
          description: "Read-only freight tracking for enterprise customers",
        },
        {
          keyPrefix: "sg_live_dispatcher_sis",
          role: "DISPATCHER",
          tenantId: "DE-SIS-8921",
          scopes: ["shipments:read", "shipments:write", "dispatch:manage"],
          description: "Feeder dispatch operations and capacity booking",
        },
        {
          keyPrefix: "sg_live_compliance_officer",
          role: "COMPLIANCE_OFFICER",
          tenantId: "DE-SIS-8921",
          scopes: ["shipments:read", "compliance:audit"],
          description: "German DSGVO Art. 15 export & 90-day retention pruning",
        },
        {
          keyPrefix: "sg_live_admin_master",
          role: "INTEGRATION_SYSTEM",
          tenantId: "DE-SIS-8921",
          scopes: [
            "shipments:read",
            "shipments:write",
            "dispatch:manage",
            "compliance:audit",
            "webhooks:publish",
          ],
          description: "Full administrative integration access",
        },
      ],
    });
  });
}
