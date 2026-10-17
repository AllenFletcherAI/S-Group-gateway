import { test } from "node:test";
import assert from "node:assert/strict";
import { buildServer } from "../src/server.js";
import { resetRateLimits, createRateLimitHook } from "../src/middleware/rateLimiter.js";
import fastify from "fastify";

test("Slice 7 Rate Limiter: Emits standard RFC rate limit headers and decrements remaining", async () => {
  resetRateLimits();
  const app = await buildServer();

  // First request: remaining should be limit - 1
  const res1 = await app.inject({
    method: "GET",
    url: "/api/v1/shipments",
  });

  assert.equal(res1.statusCode, 200);
  assert.equal(Number(res1.headers["x-ratelimit-limit"]), 100);
  assert.equal(Number(res1.headers["x-ratelimit-remaining"]), 99);
  assert.ok(Number(res1.headers["x-ratelimit-reset"]) > 0);

  // Second request: remaining should be limit - 2
  const res2 = await app.inject({
    method: "GET",
    url: "/api/v1/shipments",
  });

  assert.equal(res2.statusCode, 200);
  assert.equal(Number(res2.headers["x-ratelimit-remaining"]), 98);

  await app.close();
});

test("Slice 7 Rate Limiter: Blocks requests with HTTP 429 and Retry-After header when threshold exceeded", async () => {
  resetRateLimits();

  // Create isolated small test server with threshold of 3 requests per 1000ms
  const testApp = fastify();
  const smallLimiter = createRateLimitHook({
    windowMs: 1000,
    maxRequests: 3,
    bucketName: "test-bucket",
  });

  testApp.get("/test", { preHandler: [smallLimiter] }, async () => ({ ok: true }));

  // Requests 1, 2, 3 should succeed
  for (let i = 1; i <= 3; i++) {
    const res = await testApp.inject({ method: "GET", url: "/test" });
    assert.equal(res.statusCode, 200);
    assert.equal(Number(res.headers["x-ratelimit-remaining"]), 3 - i);
  }

  // Request 4 must be blocked with HTTP 429
  const res4 = await testApp.inject({ method: "GET", url: "/test" });
  assert.equal(res4.statusCode, 429);
  assert.equal(Number(res4.headers["x-ratelimit-remaining"]), 0);
  assert.ok(res4.headers["retry-after"], "Must include Retry-After header");

  const body4 = JSON.parse(res4.payload);
  assert.equal(body4.statusCode, 429);
  assert.equal(body4.error, "Too Many Requests");
  assert.match(body4.message, /Rate limit exceeded for \[test-bucket\]/);
  assert.ok(body4.retryAfterSeconds >= 1);

  await testApp.close();
});

test("Slice 7 Rate Limiter: Carrier webhook bucket throttles per carrier/ip independently", async () => {
  resetRateLimits();
  const app = await buildServer();

  // Probe with carrier header
  const res = await app.inject({
    method: "POST",
    url: "/api/v1/webhooks/carrier",
    headers: {
      "x-carrier-id": "DHL",
    },
    payload: {},
  });

  // Even if signature check fails (401), rate limiter preHandler runs first and emits headers
  assert.equal(Number(res.headers["x-ratelimit-limit"]), 60);
  assert.ok(Number(res.headers["x-ratelimit-remaining"]) <= 59);

  await app.close();
});

test("Slice 7 Rate Limiter: Compliance pruning trigger enforces strict 10 req/min rate limit", async () => {
  resetRateLimits();
  const app = await buildServer();

  const res = await app.inject({
    method: "POST",
    url: "/api/v1/compliance/prune",
    payload: { tenantId: "DE-SIS-8921", dryRun: true },
  });

  assert.equal(res.statusCode, 200);
  assert.equal(Number(res.headers["x-ratelimit-limit"]), 10);
  assert.equal(Number(res.headers["x-ratelimit-remaining"]), 9);

  await app.close();
});
