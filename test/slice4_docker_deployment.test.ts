import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

test("Slice 4 Containerization: Dockerfile enforces multi-stage hardened build", () => {
  const dockerfilePath = path.resolve("Dockerfile");
  assert.ok(fs.existsSync(dockerfilePath), "Dockerfile must exist");

  const content = fs.readFileSync(dockerfilePath, "utf-8");

  // 1. Multi-stage build check
  assert.match(content, /FROM\s+node:24-alpine\s+AS\s+builder/i, "Must use node:24-alpine builder stage");
  assert.match(content, /FROM\s+node:24-alpine\s+AS\s+runner/i, "Must use node:24-alpine runner stage");

  // 2. Non-root security check
  assert.match(content, /USER\s+node/i, "Must switch to unprivileged non-root 'node' user");

  // 3. Healthcheck check
  assert.match(content, /HEALTHCHECK/i, "Must declare container HEALTHCHECK");
  assert.match(content, /http:\/\/127\.0\.0\.1:3000\/health/i, "Healthcheck must target /health endpoint");

  // 4. Clean entrypoint
  assert.match(content, /CMD\s+\["node",\s+"dist\/server\.js"\]/i, "Must launch dist/server.js in production");
});

test("Slice 4 Containerization: .dockerignore properly excludes bloat and secrets", () => {
  const ignorePath = path.resolve(".dockerignore");
  assert.ok(fs.existsSync(ignorePath), ".dockerignore must exist");

  const content = fs.readFileSync(ignorePath, "utf-8");
  const lines = content.split("\n").map((l) => l.trim());

  assert.ok(lines.includes("node_modules"), "Must ignore node_modules");
  assert.ok(lines.includes(".git"), "Must ignore .git");
  assert.ok(lines.includes("dist"), "Must ignore dist build cache");
  assert.ok(lines.includes(".env") || lines.includes(".env*"), "Must ignore .env credentials");
});

test("Slice 4 Containerization: docker-compose.yml configures gateway service and security options", () => {
  const composePath = path.resolve("docker-compose.yml");
  assert.ok(fs.existsSync(composePath), "docker-compose.yml must exist");

  const content = fs.readFileSync(composePath, "utf-8");

  assert.match(content, /services:/i, "Must declare services");
  assert.match(content, /gateway:/i, "Must declare gateway service");
  assert.match(content, /(3000}:3000|3000:3000)/i, "Must map port 3000");
  assert.match(content, /no-new-privileges:true/i, "Must enforce no-new-privileges security constraint");
  assert.match(content, /http:\/\/127\.0\.0\.1:3000\/health/i, "Compose must configure /health probe");
});

test("Slice 4 Containerization: Production distribution assets exist and match Dockerfile CMD targets", () => {
  const serverJsPath = path.resolve("dist", "server.js");
  const publicCssPath = path.resolve("dist", "public", "css", "layout.css");

  assert.ok(fs.existsSync(serverJsPath), "dist/server.js must exist after build");
  assert.ok(fs.existsSync(publicCssPath), "dist/public/css/layout.css must exist after build");
});
