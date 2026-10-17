# Failure Modes & Resilience Map

> Walk each dependency: what if it is slow, down, wrong, or empty? (Habit 19).
> Where does this fail is the question that separates people who understand a system from people who merely deployed it.

## Dependency Resilience Matrix
| Dependency | When Slow (>2s) | When Down (5xx / Refused) | When Wrong / Corrupted | When Empty (0 records) | Observability (Alerts / Metrics) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Primary Database | Connection pool times out after 3000ms | Returns HTTP 503 Service Unavailable | Schema deserialization rejects with 500 error | Returns empty collection with HTTP 200 | DB latency P99 alert (>500ms); connection pool exhaustion alert |
| External Payment API | Circuit breaker trips after 3 timeouts | Queues transaction for retry in background | Discards payload and triggers fraud alert | Treats as invalid response and aborts | Payment gateway failure counter; PagerDuty webhook alert |
| Redis Cache | Falls back directly to primary DB | Bypasses cache transparently | Flushes stale cache key on parse failure | Fetches fresh record from database | Redis heartbeat monitor; cache miss rate spike alert |

## First Expected Limits
- **Concurrency Limit:** 500 concurrent connections before thread pool saturation.
- **Payload Limit:** 10MB maximum request body size (enforced at API gateway).
- **Request Timeout:** 5000ms hard client timeout.
