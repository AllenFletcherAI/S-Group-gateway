import crypto from "crypto";

export interface SignatureVerificationResult {
  valid: boolean;
  reason?: string;
}

export interface VerifySignatureParams {
  rawBody: string;
  signatureHeader: string | undefined;
  timestampHeader: string | undefined;
  secret: string;
  maxClockSkewMs?: number; // default: 300,000ms (5 minutes)
}

/**
 * Generate HMAC-SHA256 signature for outgoing simulation or carrier partner reference.
 * WHY: Canonical signature format binds the timestamp to payload body to prevent replay attacks.
 */
export function generateHmacSignature(rawBody: string, timestamp: string, secret: string): string {
  const signaturePayload = `${timestamp}.${rawBody}`;
  return crypto.createHmac("sha256", secret).update(signaturePayload, "utf8").digest("hex");
}

/**
 * Verify cryptographic webhook signature and timestamp freshness.
 * WHY: Defends against forged carrier webhooks, tamper-in-flight modifications,
 * and replay attacks across the public internet.
 */
export function verifyWebhookSignature(params: VerifySignatureParams): SignatureVerificationResult {
  const {
    rawBody,
    signatureHeader,
    timestampHeader,
    secret,
    maxClockSkewMs = 300_000 // 5 minutes
  } = params;

  if (!signatureHeader) {
    return { valid: false, reason: "Missing X-Carrier-Signature header" };
  }

  if (!timestampHeader) {
    return { valid: false, reason: "Missing X-Carrier-Timestamp header" };
  }

  const requestTime = parseInt(timestampHeader, 10);
  if (isNaN(requestTime)) {
    return { valid: false, reason: "Invalid X-Carrier-Timestamp (must be epoch milliseconds)" };
  }

  const now = Date.now();
  const timeDifference = now - requestTime;

  // Reject replay attacks older than 5 minutes
  if (timeDifference > maxClockSkewMs) {
    return {
      valid: false,
      reason: `Replay attack detected: Timestamp expired (${Math.round(timeDifference / 1000)}s old > ${Math.round(maxClockSkewMs / 1000)}s limit)`
    };
  }

  // Reject timestamps in the future by more than 60 seconds (clock skew)
  if (timeDifference < -60_000) {
    return {
      valid: false,
      reason: `Clock skew error: Timestamp is in the future (${Math.round(Math.abs(timeDifference) / 1000)}s ahead)`
    };
  }

  // Compute expected HMAC
  const expectedSignatureHex = generateHmacSignature(rawBody, timestampHeader, secret);

  const providedBuffer = Buffer.from(signatureHeader, "hex");
  const expectedBuffer = Buffer.from(expectedSignatureHex, "hex");

  // Constant-time comparison to prevent timing attacks
  if (providedBuffer.length !== expectedBuffer.length) {
    return { valid: false, reason: "Signature length mismatch" };
  }

  const isMatch = crypto.timingSafeEqual(providedBuffer, expectedBuffer);
  if (!isMatch) {
    return { valid: false, reason: "Cryptographic signature mismatch (tampered payload or invalid secret)" };
  }

  return { valid: true };
}
