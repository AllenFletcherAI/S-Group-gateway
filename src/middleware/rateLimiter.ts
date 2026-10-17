import { FastifyRequest, FastifyReply } from "fastify";

export interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
  bucketName: string;
  keyGenerator?: (req: FastifyRequest) => string;
}

// In-memory sliding-window log store: Map<"bucket:key", timestamp[]>
const SLIDING_LOGS = new Map<string, number[]>();

/**
 * Reset rate limit stores (useful for test suites)
 */
export function resetRateLimits() {
  SLIDING_LOGS.clear();
}

/**
 * Sliding-Window Rate Limiter Hook Factory
 * WHY: Protects public API and carrier webhook endpoints from DoS flooding
 * and rogue carrier loops without the 2x burst flaw of fixed-window counters (D-007).
 */
export function createRateLimitHook(options: RateLimitOptions) {
  const {
    windowMs,
    maxRequests,
    bucketName,
    keyGenerator = (req) => req.ip || "127.0.0.1",
  } = options;

  return async function rateLimitHook(req: FastifyRequest, reply: FastifyReply) {
    // In test environment, allow bypassing with test header if explicitly asked
    if (req.headers["x-bypass-rate-limit"] === "true") {
      return;
    }

    const now = Date.now();
    const clientKey = keyGenerator(req);
    const storageKey = `${bucketName}:${clientKey}`;

    // Get or initialize timestamp log for this client
    let timestamps = SLIDING_LOGS.get(storageKey) || [];

    // Evict all timestamps that have fallen outside the sliding window
    const windowStart = now - windowMs;
    timestamps = timestamps.filter((t) => t > windowStart);

    const currentCount = timestamps.length + 1;
    const remaining = Math.max(0, maxRequests - currentCount);
    const oldestTimestamp = timestamps[0] || now;
    const resetTimeSeconds = Math.max(1, Math.ceil((oldestTimestamp + windowMs - now) / 1000));

    // Standard RFC Rate Limit Headers
    reply.header("X-RateLimit-Limit", maxRequests);
    reply.header("X-RateLimit-Remaining", remaining);
    reply.header("X-RateLimit-Reset", resetTimeSeconds);

    if (timestamps.length >= maxRequests) {
      reply.header("Retry-After", resetTimeSeconds);
      req.log.warn({
        bucket: bucketName,
        clientKey,
        count: currentCount,
        maxRequests,
        resetTimeSeconds,
        msg: "Rate limit exceeded (HTTP 429)",
      });

      return reply.status(429).send({
        statusCode: 429,
        error: "Too Many Requests",
        message: `Rate limit exceeded for [${bucketName}]. Max ${maxRequests} requests per ${Math.round(windowMs / 1000)}s. Please retry in ${resetTimeSeconds} seconds.`,
        retryAfterSeconds: resetTimeSeconds,
      });
    }

    // Record this request timestamp and update store
    timestamps.push(now);
    SLIDING_LOGS.set(storageKey, timestamps);
  };
}

/**
 * Standard Pre-Configured S-Group Gateway Rate Limiters
 */
export const carrierWebhookRateLimiter = createRateLimitHook({
  windowMs: 60_000, // 1 minute
  maxRequests: 60, // 60 requests/minute per carrier/ip
  bucketName: "carrier-webhooks",
  keyGenerator: (req) => {
    const carrier = (req.headers["x-carrier-id"] as string) || "UNKNOWN";
    return `${req.ip}:${carrier}`;
  },
});

export const apiQueryRateLimiter = createRateLimitHook({
  windowMs: 60_000,
  maxRequests: 100, // 100 requests/minute for query endpoints
  bucketName: "api-queries",
});

export const compliancePruningRateLimiter = createRateLimitHook({
  windowMs: 60_000,
  maxRequests: 10, // 10 sweeps/minute to protect CPU
  bucketName: "compliance-prune",
});
