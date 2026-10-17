import crypto from "crypto";
import { FastifyRequest, FastifyReply } from "fastify";

export type PermissionScope =
  | "shipments:read"
  | "shipments:write"
  | "dispatch:manage"
  | "compliance:audit"
  | "webhooks:publish";

export type PrincipalRole =
  | "CUSTOMER_VIEWER"
  | "DISPATCHER"
  | "COMPLIANCE_OFFICER"
  | "INTEGRATION_SYSTEM";

export interface AuthPrincipal {
  principalId: string;
  tenantId: string;
  role: PrincipalRole;
  scopes: PermissionScope[];
  description: string;
}

export interface ApiKeyRecord extends AuthPrincipal {
  apiKey: string;
  hashedKey: string;
}

export interface JwtPayload {
  sub: string;
  tenantId: string;
  role: PrincipalRole;
  scopes: PermissionScope[];
  iat: number;
  exp: number;
}

// Secret used for internal JWT generation (overridable via JWT_SECRET env var)
const JWT_SECRET = process.env.JWT_SECRET || "s-group-secret-key-dsgvo-compliant-2026";

/**
 * SHA-256 helper for constant-time cryptographic hash comparison
 */
function hashString(input: string): Buffer {
  return crypto.createHash("sha256").update(input, "utf8").digest();
}

/**
 * Constant-time comparison between input key and stored key
 * WHY: Defends against timing side-channel attacks by comparing equal-length SHA-256 buffers (D-009).
 */
function timingSafeCompare(a: string, b: string): boolean {
  const hashA = hashString(a);
  const hashB = hashString(b);
  return crypto.timingSafeEqual(hashA, hashB);
}

// Pre-seeded enterprise API key directory (Schäfer & SIS Interlogistik + Tenant Competitor)
const API_KEY_REGISTRY: ApiKeyRecord[] = [
  {
    apiKey: "sg_live_customer_bmw",
    hashedKey: hashString("sg_live_customer_bmw").toString("hex"),
    principalId: "USR-BMW-001",
    tenantId: "DE-SIS-8921",
    role: "CUSTOMER_VIEWER",
    scopes: ["shipments:read"],
    description: "Enterprise Customer Read-Only Viewer (BMW Logistics Desk)",
  },
  {
    apiKey: "sg_live_dispatcher_sis",
    hashedKey: hashString("sg_live_dispatcher_sis").toString("hex"),
    principalId: "DISP-SIS-442",
    tenantId: "DE-SIS-8921",
    role: "DISPATCHER",
    scopes: ["shipments:read", "shipments:write", "dispatch:manage"],
    description: "Senior Feeder Tour Dispatcher (Schäfer & SIS Interlogistik)",
  },
  {
    apiKey: "sg_live_compliance_officer",
    hashedKey: hashString("sg_live_compliance_officer").toString("hex"),
    principalId: "DPO-GER-801",
    tenantId: "DE-SIS-8921",
    role: "COMPLIANCE_OFFICER",
    scopes: ["shipments:read", "compliance:audit"],
    description: "German DSGVO Data Protection & Audit Officer",
  },
  {
    apiKey: "sg_live_admin_master",
    hashedKey: hashString("sg_live_admin_master").toString("hex"),
    principalId: "SYS-ADMIN-001",
    tenantId: "DE-SIS-8921",
    role: "INTEGRATION_SYSTEM",
    scopes: [
      "shipments:read",
      "shipments:write",
      "dispatch:manage",
      "compliance:audit",
      "webhooks:publish",
    ],
    description: "Master Automation Gateway & ERP Service Account",
  },
  {
    apiKey: "sg_live_competitor_key",
    hashedKey: hashString("sg_live_competitor_key").toString("hex"),
    principalId: "USR-COMPETITOR-99",
    tenantId: "TENANT-COMPETITOR-XYZ",
    role: "CUSTOMER_VIEWER",
    scopes: ["shipments:read"],
    description: "Isolated Third-Party Competitor Tenant Key",
  },
];

/**
 * Find principal by API Key using constant-time evaluation
 */
export function findPrincipalByApiKey(apiKey: string): AuthPrincipal | null {
  for (const record of API_KEY_REGISTRY) {
    if (timingSafeCompare(apiKey, record.apiKey)) {
      return {
        principalId: record.principalId,
        tenantId: record.tenantId,
        role: record.role,
        scopes: [...record.scopes],
        description: record.description,
      };
    }
  }
  return null;
}

/**
 * Generate a cryptographically signed HMAC-SHA256 JWT token
 */
export function signJwtToken(
  principal: Omit<AuthPrincipal, "description">,
  expiresInSeconds: number = 3600
): string {
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payload: JwtPayload = {
    sub: principal.principalId,
    tenantId: principal.tenantId,
    role: principal.role,
    scopes: principal.scopes,
    iat: now,
    exp: now + expiresInSeconds,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(`${header}.${encodedPayload}`)
    .digest("base64url");

  return `${header}.${encodedPayload}.${signature}`;
}

/**
 * Verify and parse a signed JWT token
 */
export function verifyJwtToken(token: string): { valid: boolean; payload?: JwtPayload; error?: string } {
  const parts = token.split(".");
  if (parts.length !== 3) {
    return { valid: false, error: "Malformed JWT token structure" };
  }

  const [header, payloadB64, signature] = parts;
  const expectedSignature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(`${header}.${payloadB64}`)
    .digest("base64url");

  if (!timingSafeCompare(signature, expectedSignature)) {
    return { valid: false, error: "Invalid cryptographic JWT signature" };
  }

  try {
    const payload: JwtPayload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"));
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return { valid: false, error: "JWT token has expired" };
    }
    return { valid: true, payload };
  } catch (_e) {
    return { valid: false, error: "Invalid JWT payload encoding" };
  }
}

/**
 * Extract credential token from HTTP request headers or query string
 */
export function extractCredential(req: FastifyRequest): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7).trim();
  }

  const apiKeyHeader = req.headers["x-api-key"];
  if (typeof apiKeyHeader === "string" && apiKeyHeader.trim()) {
    return apiKeyHeader.trim();
  }

  const query = req.query as Record<string, string> | undefined;
  if (query && query.apiKey) {
    return query.apiKey.trim();
  }

  return null;
}

export interface AuthHookOptions {
  requiredScopes?: PermissionScope[];
  allowPublicDemoFallback?: boolean; // For local portal demo browsing without login wall
}

/**
 * Create a Fastify preHandler hook enforcing authentication and Role-Based Access Control (RBAC).
 * WHY: Reusable, zero-dependency security guard defending API boundaries (D-009).
 */
export function requireAuth(options: AuthHookOptions = {}) {
  const { requiredScopes = [], allowPublicDemoFallback = false } = options;

  return async function authHook(req: FastifyRequest, reply: FastifyReply) {
    const credential = extractCredential(req);

    let principal: AuthPrincipal | null = null;

    if (credential) {
      // 1. Attempt API key lookup
      if (credential.startsWith("sg_live_")) {
        principal = findPrincipalByApiKey(credential);
      } else {
        // 2. Attempt JWT token verification
        const jwtResult = verifyJwtToken(credential);
        if (jwtResult.valid && jwtResult.payload) {
          principal = {
            principalId: jwtResult.payload.sub,
            tenantId: jwtResult.payload.tenantId,
            role: jwtResult.payload.role,
            scopes: jwtResult.payload.scopes,
            description: `Session JWT: ${jwtResult.payload.sub}`,
          };
        } else if (!jwtResult.valid) {
          return reply.status(401).send({
            statusCode: 401,
            error: "Unauthorized",
            message: `Authentication failed: ${jwtResult.error}`,
          });
        }
      }

      if (!principal) {
        return reply.status(401).send({
          statusCode: 401,
          error: "Unauthorized",
          message: "Invalid API key or token signature",
        });
      }
    } else {
      // If credential is missing but allowPublicDemoFallback is enabled (e.g. for local portal browsing & tests)
      if (allowPublicDemoFallback) {
        principal = {
          principalId: "GUEST-DEMO",
          tenantId: (req.headers["x-tenant-id"] as string) || "DE-SIS-8921",
          role: "INTEGRATION_SYSTEM",
          scopes: [
            "shipments:read",
            "shipments:write",
            "dispatch:manage",
            "compliance:audit",
            "webhooks:publish",
          ],
          description: "Unauthenticated Local Demo Principal (Full Demo Permissions)",
        };
      } else {
        return reply.status(401).send({
          statusCode: 401,
          error: "Unauthorized",
          message: "Missing authentication credentials. Provide 'Authorization: Bearer <token>' or 'X-API-Key' header.",
        });
      }
    }

    // Enforce Scope Permission Checks (RBAC)
    if (requiredScopes.length > 0) {
      const missingScopes = requiredScopes.filter((s) => !principal!.scopes.includes(s));
      if (missingScopes.length > 0) {
        return reply.status(403).send({
          statusCode: 403,
          error: "Forbidden",
          message: `Insufficient permissions. Missing required scope(s): ${JSON.stringify(missingScopes)}. Your granted scopes: ${JSON.stringify(principal.scopes)}`,
          requiredScopes,
          grantedScopes: principal.scopes,
        });
      }
    }

    // Attach verified principal and cryptographically bound tenantId to request context
    (req as any).principal = principal;
    (req as any).tenantId = principal.tenantId;
  };
}
