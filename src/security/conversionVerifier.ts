/**
 * Rewalf Cryptographic Conversion Verification Engine
 *
 * Implements secure server-to-server webhook verification:
 * - HMAC-SHA256 signature verification
 * - Replay attack prevention with timestamp tolerances
 * - Idempotency & duplicate event detection
 * - Business escrow capacity enforcement
 * - Self-referral fraud prevention
 */

export interface WebhookConversionPayload {
  eventId: string; // Unique UUID for idempotency
  orderId: string; // Merchant customer order / invoice identifier
  campaignCode: string; // Referral campaign code
  referrerAddress: string; // Stellar public key of promoter
  amountPaid: string; // Order purchase amount
  rewardAmount: string; // Reward bounty
  assetCode: 'USDC' | 'XLM';
  customerLabel?: string;
  timestamp: number; // Unix epoch ms
}

export interface VerificationResult {
  valid: boolean;
  code:
    | 'SUCCESS'
    | 'INVALID_SIGNATURE'
    | 'REPLAY_DETECTED'
    | 'TIMESTAMP_OUT_OF_WINDOW'
    | 'DUPLICATE_ORDER'
    | 'SELF_REFERRAL_BLOCKED'
    | 'INSUFFICIENT_ESCROW'
    | 'CAMPAIGN_NOT_FOUND'
    | 'MALFORMED_PAYLOAD';
  message: string;
  details?: Record<string, unknown>;
}

// In-memory idempotency log of processed event IDs with processing timestamp
const processedEventIds = new Map<string, number>();

// Replay tolerance: 5 minutes (300,000 ms)
const MAX_CLOCK_SKEW_MS = 5 * 60 * 1000;

/**
 * Computes an HMAC-SHA256 hex digest using standard Web Crypto API
 */
export async function computeHmacSha256(secret: string, message: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(message);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
  const hashArray = Array.from(new Uint8Array(signatureBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Serializes payload into canonical string representation for HMAC verification
 */
export function canonicalizePayload(payload: WebhookConversionPayload): string {
  // Canonical order: eventId, orderId, campaignCode, referrerAddress, amountPaid, rewardAmount, assetCode, timestamp
  return [
    payload.eventId,
    payload.orderId,
    payload.campaignCode.toLowerCase(),
    payload.referrerAddress.trim(),
    payload.amountPaid,
    payload.rewardAmount,
    payload.assetCode,
    payload.timestamp.toString(),
  ].join('|');
}

/**
 * Sign a conversion payload with merchant's webhook secret
 */
export async function signConversionPayload(
  secret: string,
  payload: WebhookConversionPayload
): Promise<string> {
  const canonical = canonicalizePayload(payload);
  return computeHmacSha256(secret, canonical);
}

/**
 * Constant-time string comparison to mitigate timing attacks
 */
export function secureTimingCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

export interface VerifyWebhookRequest {
  payload: WebhookConversionPayload;
  signature: string;
  secret: string;
  campaignContext?: {
    businessAddress: string;
    remainingBudget: number;
    existingOrderIds: string[];
  };
}

/**
 * Authenticates and validates a server-to-server conversion webhook
 */
export async function authenticateConversionWebhook(
  req: VerifyWebhookRequest
): Promise<VerificationResult> {
  const { payload, signature, secret, campaignContext } = req;

  // 1. Structural Validation
  if (
    !payload ||
    !payload.eventId ||
    !payload.orderId ||
    !payload.campaignCode ||
    !payload.referrerAddress ||
    !payload.rewardAmount ||
    !payload.timestamp
  ) {
    return {
      valid: false,
      code: 'MALFORMED_PAYLOAD',
      message: 'Payload is missing mandatory fields (eventId, orderId, campaignCode, referrerAddress, rewardAmount, timestamp).',
    };
  }

  // 2. Cryptographic HMAC Signature Validation
  try {
    const canonical = canonicalizePayload(payload);
    const expectedSignature = await computeHmacSha256(secret, canonical);

    if (!secureTimingCompare(signature.toLowerCase(), expectedSignature.toLowerCase())) {
      return {
        valid: false,
        code: 'INVALID_SIGNATURE',
        message: 'Cryptographic signature mismatch. Payload may have been tampered with or signed with an invalid secret.',
        details: { providedSignature: signature, expectedSignaturePrefix: expectedSignature.slice(0, 8) + '...' },
      };
    }
  } catch (err: any) {
    return {
      valid: false,
      code: 'INVALID_SIGNATURE',
      message: `Failed to compute HMAC signature: ${err.message}`,
    };
  }

  // 3. Timestamp Window & Replay Protection
  const now = Date.now();
  const timeDifference = Math.abs(now - payload.timestamp);
  if (timeDifference > MAX_CLOCK_SKEW_MS) {
    return {
      valid: false,
      code: 'TIMESTAMP_OUT_OF_WINDOW',
      message: `Event timestamp is outside the acceptable 5-minute replay window (drift: ${Math.round(timeDifference / 1000)}s).`,
      details: { eventTimestamp: payload.timestamp, serverTimestamp: now, maxToleranceSeconds: 300 },
    };
  }

  // 4. Idempotency Check (Event ID Deduplication)
  if (processedEventIds.has(payload.eventId)) {
    return {
      valid: false,
      code: 'REPLAY_DETECTED',
      message: `Event ID "${payload.eventId}" has already been received and processed. Replay attacks are rejected.`,
      details: { firstProcessedAt: processedEventIds.get(payload.eventId) },
    };
  }

  // 5. Campaign Context Checks (if provided)
  if (campaignContext) {
    // 5a. Self-Referral Prevention
    if (
      payload.referrerAddress.trim().toLowerCase() ===
      campaignContext.businessAddress.trim().toLowerCase()
    ) {
      return {
        valid: false,
        code: 'SELF_REFERRAL_BLOCKED',
        message: 'Self-referral detected. Campaign creator cannot claim reward bounties on their own campaigns.',
      };
    }

    // 5b. Duplicate Order Prevention
    const isDuplicateOrder = campaignContext.existingOrderIds.some(
      (id) => id.trim().toLowerCase() === payload.orderId.trim().toLowerCase()
    );
    if (isDuplicateOrder) {
      return {
        valid: false,
        code: 'DUPLICATE_ORDER',
        message: `Order ID "${payload.orderId}" has already been verified and rewarded for this campaign.`,
      };
    }

    // 5c. Escrow Fund Availability Check
    const rewardNum = parseFloat(payload.rewardAmount);
    if (campaignContext.remainingBudget < rewardNum) {
      return {
        valid: false,
        code: 'INSUFFICIENT_ESCROW',
        message: `Reward amount (${rewardNum}) exceeds available deposited escrow balance (${campaignContext.remainingBudget}). Rewards cannot exceed available escrow funds.`,
        details: { rewardRequired: rewardNum, escrowAvailable: campaignContext.remainingBudget },
      };
    }
  }

  // Mark event ID as processed
  processedEventIds.set(payload.eventId, now);

  return {
    valid: true,
    code: 'SUCCESS',
    message: 'Cryptographic signature, timestamp tolerance, idempotency, and fraud checks passed successfully.',
  };
}

/**
 * Clear processed event ID cache (for testing)
 */
export function resetIdempotencyCache(): void {
  processedEventIds.clear();
}
