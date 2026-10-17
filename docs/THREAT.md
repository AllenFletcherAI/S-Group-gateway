# Threat Model & Abuse Scenarios

> List who could behave badly and what they could do (Habit 18).
> An admitted gap beats a hidden one. Probe with Strix Security.

## Threat Actor Taxonomy
1. **Anonymous Visitor:** Public internet actor with zero credentials.
2. **Authenticated Malicious User:** Registered user attempting cross-tenant access (IDOR/BOLA) or privilege escalation.
3. **Compromised Dependency:** Malicious npm/PyPI package attempting secret harvesting or background data exfiltration.
4. **External Webhook / Integration:** Spoofed or replayed webhook events from third-party partners.
5. **Malicious Insider:** Direct attempt to tamper with database records or bypass audit logs.

## Entry Point Analysis Table
| Entry Point | Threat Actor | Worst Realistic Abuse | Mitigation in Place | Admitted Known Gap | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Public API / Login | Anonymous | Brute-force credential stuffing / DoS | Rate limiter & Argon2 password hashing | In-memory rate limiter requires Redis cluster for horizontal scale | Active |
| Resource Fetch Endpoint | Authenticated User | IDOR to view adjacent tenant records | Tenant ID joined in database query filter | None; strict tenant isolation enforced | Active |
| External Webhooks | Webhook Sender | Replay attacks / forged payloads | HMAC-SHA256 signature verification with 5m timestamp window | Replay nonce cache expires after 24h | Active |
