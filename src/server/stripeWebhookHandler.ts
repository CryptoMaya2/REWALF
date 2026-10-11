import Stripe from 'stripe';

export interface StripeWebhookVerificationOptions {
  rawBody: string | Buffer;
  signatureHeader: string | null | undefined;
  secret?: string; // Optional override; defaults to process.env.STRIPE_WEBHOOK_SECRET
  toleranceSeconds?: number;
}

export interface StripeWebhookVerificationResult {
  valid: boolean;
  event?: Stripe.Event;
  errorCode?: 'MISSING_SECRET' | 'MISSING_SIGNATURE' | 'MISSING_RAW_BODY' | 'SIGNATURE_VERIFICATION_FAILED';
  errorMessage?: string;
}

/**
 * Server-side Stripe Webhook Signature Verification Engine
 *
 * Cryptographically verifies that incoming Stripe webhooks originated from Stripe
 * using the official Stripe SDK (`stripe.webhooks.constructEvent`) and the raw,
 * unparsed request body.
 *
 * Security Invariants:
 * 1. Webhook secrets MUST be read from server-side environment variables (`STRIPE_WEBHOOK_SECRET`).
 * 2. Secrets must NEVER be prefixed with `VITE_` or bundled in client-side artifacts.
 * 3. Verification MUST use the raw request body Buffer/string to prevent JSON parsing attacks.
 * 4. Replay attacks are mitigated by Stripe's timestamp tolerance check.
 */
export function verifyStripeWebhookSignature(
  options: StripeWebhookVerificationOptions
): StripeWebhookVerificationResult {
  const { rawBody, signatureHeader, secret: explicitSecret, toleranceSeconds } = options;

  // 1. Resolve secret from server-side environment or explicit test override
  const webhookSecret =
    explicitSecret ||
    (typeof process !== 'undefined' ? process.env?.STRIPE_WEBHOOK_SECRET : undefined);

  if (!webhookSecret) {
    return {
      valid: false,
      errorCode: 'MISSING_SECRET',
      errorMessage: 'Server-side STRIPE_WEBHOOK_SECRET environment variable is not configured.',
    };
  }

  // 2. Validate raw body presence
  if (
    rawBody === undefined ||
    rawBody === null ||
    (typeof rawBody === 'string' && rawBody.length === 0)
  ) {
    return {
      valid: false,
      errorCode: 'MISSING_RAW_BODY',
      errorMessage:
        'Missing raw request body. Stripe signature verification requires the exact, unparsed request payload.',
    };
  }

  // 3. Validate signature header presence
  if (!signatureHeader) {
    return {
      valid: false,
      errorCode: 'MISSING_SIGNATURE',
      errorMessage: 'Missing Stripe-Signature header in webhook request.',
    };
  }

  // 4. Construct event using Stripe's official verification SDK
  const stripeSecretKey =
    typeof process !== 'undefined' ? process.env?.STRIPE_SECRET_KEY : undefined;

  const stripe = new Stripe(stripeSecretKey || 'sk_test_placeholder_key_for_init', {
    apiVersion: '2025-02-24.acacia' as any,
  });

  try {
    const event = stripe.webhooks.constructEvent(
      rawBody,
      signatureHeader,
      webhookSecret,
      toleranceSeconds
    );
    return {
      valid: true,
      event,
    };
  } catch (err: any) {
    return {
      valid: false,
      errorCode: 'SIGNATURE_VERIFICATION_FAILED',
      errorMessage: `Stripe webhook signature verification failed: ${err.message}`,
    };
  }
}

/**
 * Generates a mock Stripe signature header using Stripe's official test utility.
 * Strictly intended for nonfunctional test fixtures and automated test suites.
 */
export function generateTestStripeSignature(
  payload: string,
  secret: string,
  timestamp?: number
): string {
  const stripe = new Stripe('sk_test_placeholder', {
    apiVersion: '2025-02-24.acacia' as any,
  });
  return stripe.webhooks.generateTestHeaderString({
    payload,
    secret,
    timestamp,
  });
}
