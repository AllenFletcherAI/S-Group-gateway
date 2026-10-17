# Failure Modes & Resilience Map

> Walk each dependency: what if it is slow, down, wrong, or empty? (Habit 19).
> Where does this fail is the question that separates people who understand a system from people who merely deployed it.
> System: S-Group Gateway (Schäfer & SIS Interlogistik) • Classification: Lane B

## Dependency Resilience Matrix (The 4 Breakdown States)
| Component | When It Is Slow (>2s) | When It Stops Completely | When It Sends Garbage | When It Sends An Empty Box | Observability & Alarms |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **PostgreSQL Database** | Pool times out after 3000ms to avoid freezing customer screens | Returns HTTP 503 "Service temporarily unavailable, please retry" | Schema deserializer rejects invalid columns; rollback transaction | Returns empty array `[]` with HTTP 200 without throwing errors | DB latency P99 alert (>500ms); connection pool saturation metric |
| **Carrier Inbound Webhooks (DHL/Schenker/Maersk)** | Async intake returns HTTP 202 immediately; background queue absorbs latency | Carrier retries automatically per webhook exponential backoff | Zod schema rejects malformed payload with HTTP 400 and structured issue logs | Drops empty body with HTTP 400 Bad Request | Webhook 4xx/5xx spike alarm; invalid signature surge alarm |
| **Fastify Gateway Edge** | Node event loop lag metric triggers autoscaling; request timeout at 5000ms | Health probe `/health` fails; load balancer routes traffic to standby replica | Fastify body parser catches syntax errors and responds with HTTP 400 | Serves default layout with empty state component | Process uptime monitor; HTTP 5xx error rate alert (>1% threshold) |
| **Customs Document Storage** | Document metadata serves from DB; download initiates async stream | Shows "Document temporarily unavailable for download, contact dispatch" | Checksum verification detects SHA256 mismatch and flags security warning | Displays "No customs documents uploaded" clean notice | Missing document asset counter; checksum mismatch security alert |

## Hard Practical Limits & First Breaking Points
- **Traffic Concurrency Limit:** 500 concurrent connections per Node.js instance before event-loop latency increases past 50ms.
- **Payload Size Limit:** 1MB maximum webhook payload body (enforced by Fastify edge parser).
- **Request Timeout:** 5000ms hard server timeout on all client routes.
- **Telematics Data Lifespan:** 90 days maximum storage for raw GPS telemetry coordinates (enforced by DSGVO constraint).

