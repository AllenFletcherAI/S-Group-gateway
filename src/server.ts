import fastify, { FastifyInstance } from "fastify";
import fastifyStatic from "@fastify/static";
import path from "path";
import { fileURLToPath } from "url";
import { healthRoutes } from "./routes/health.js";
import { portalRoutes } from "./routes/portal.js";
import { webhookRoutes } from "./routes/webhooks.js";
import { apiRoutes } from "./routes/api.js";
import { complianceRoutes } from "./routes/compliance.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Server Builder Factory
 * WHY: Decoupled factory function allows running isolated unit and integration tests
 * without binding to network ports (Habit 08 & Test-Driven Discipline).
 */
export async function buildServer(): Promise<FastifyInstance> {
  const app = fastify({
    logger: {
      level: process.env.LOG_LEVEL || "info",
      // WHY: Redact sensitive headers and personal tokens to enforce German DSGVO (Art. 5 / 32)
      redact: ["req.headers.authorization", "req.headers.cookie"],
    },
  });

  // Serve static UI assets (CSS, JS, branding)
  const publicPath = path.join(__dirname, "public");
  await app.register(fastifyStatic, {
    root: publicPath,
    prefix: "/static/",
  });

  // Register modular routes
  await app.register(healthRoutes);
  await app.register(portalRoutes);
  await app.register(webhookRoutes);
  await app.register(apiRoutes);
  await app.register(complianceRoutes);

  return app;
}

/**
 * Main application entry point
 */
async function start() {
  const app = await buildServer();
  const PORT = parseInt(process.env.PORT || "3000", 10);
  const HOST = process.env.HOST || "0.0.0.0";

  try {
    await app.listen({ port: PORT, host: HOST });
    app.log.info(`S-Group Gateway running at http://${HOST}:${PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

// Execute when run directly as a server script, not when imported in test suites
const isDirectRun = Boolean(
  process.argv[1] && (
    path.resolve(process.argv[1]) === path.resolve(__filename) ||
    process.argv[1].endsWith("server.ts") ||
    process.argv[1].endsWith("server.js")
  ) &&
  process.env.NODE_ENV !== "test" &&
  !process.env.NODE_TEST_CONTEXT
);

if (isDirectRun) {
  start();
}

