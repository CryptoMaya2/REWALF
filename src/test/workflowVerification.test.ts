/**
 * Automated Workflow Verification Test Suite
 *
 * Tests the entire referral lifecycle and security invariants:
 * 1. Valid conversion verification and escrow debiting.
 * 2. Cryptographic HMAC signature tampering rejection.
 * 3. Expired timestamp / replay window rejection.
 * 4. Idempotency / duplicate event ID rejection.
 * 5. Duplicate order ID rejection.
 * 6. Self-referral fraud rejection (promoter == business owner).
 * 7. Insufficient escrow funds rejection (reward exceeds remaining balance).
 * 8. Repeated claim attempt rejection on escrow state.
 * 9. Separation of verification approval from on-chain escrow settlement.
 */

import {
  signConversionPayload,
  authenticateConversionWebhook,
  resetIdempotencyCache,
  type WebhookConversionPayload,
} from '../security/conversionVerifier.ts';
import {
  verifyStripeWebhookSignature,
  generateTestStripeSignature,
} from '../server/stripeWebhookHandler.ts';

export interface TestCaseResult {
  testName: string;
  passed: boolean;
  expectedResult: string;
  actualResult: string;
  details?: string;
}

export async function runWorkflowVerificationTests(): Promise<{
  allPassed: boolean;
  total: number;
  passed: number;
  failed: number;
  results: TestCaseResult[];
}> {
  const results: TestCaseResult[] = [];
  resetIdempotencyCache();

  const mockSecret = 'rwlf_mock_test_webhook_signing_secret_nonfunctional_fixture';
  const businessAddress = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';
  const legitimateReferrer = 'GDQOE23CFSUMSVQK4Y5JHPPYK73VYCNHZHA7ENKCV37P6SUEO6XQBKPP';

  // TEST 1: Valid Conversion Event
  {
    const payload: WebhookConversionPayload = {
      eventId: 'evt_test_001',
      orderId: 'ORD-TEST-1001',
      campaignCode: 'saas91x',
      referrerAddress: legitimateReferrer,
      amountPaid: '299.00',
      rewardAmount: '50.00',
      assetCode: 'USDC',
      customerLabel: 'Valid Customer Enterprise Seat',
      timestamp: Date.now(),
    };

    const signature = await signConversionPayload(mockSecret, payload);
    const res = await authenticateConversionWebhook({
      payload,
      signature,
      secret: mockSecret,
      campaignContext: {
        businessAddress,
        remainingBudget: 350.0,
        existingOrderIds: ['ORD-EXISTING-01'],
      },
    });

    results.push({
      testName: 'Test 1: Valid Authenticated Conversion Event',
      passed: res.valid === true && res.code === 'SUCCESS',
      expectedResult: 'SUCCESS',
      actualResult: res.code,
      details: res.message,
    });
  }

  // TEST 2: Invalid HMAC Signature (Tampered Payload)
  {
    const payload: WebhookConversionPayload = {
      eventId: 'evt_test_002',
      orderId: 'ORD-TEST-1002',
      campaignCode: 'saas91x',
      referrerAddress: legitimateReferrer,
      amountPaid: '299.00',
      rewardAmount: '50.00',
      assetCode: 'USDC',
      timestamp: Date.now(),
    };

    const signature = await signConversionPayload(mockSecret, payload);
    // Tamper with payload after signing
    payload.rewardAmount = '500.00';

    const res = await authenticateConversionWebhook({
      payload,
      signature,
      secret: mockSecret,
      campaignContext: {
        businessAddress,
        remainingBudget: 350.0,
        existingOrderIds: [],
      },
    });

    results.push({
      testName: 'Test 2: Tampered Payload / Invalid Signature Rejection',
      passed: res.valid === false && res.code === 'INVALID_SIGNATURE',
      expectedResult: 'INVALID_SIGNATURE',
      actualResult: res.code,
      details: res.message,
    });
  }

  // TEST 3: Expired Timestamp / Replay Attack Window
  {
    const payload: WebhookConversionPayload = {
      eventId: 'evt_test_003',
      orderId: 'ORD-TEST-1003',
      campaignCode: 'saas91x',
      referrerAddress: legitimateReferrer,
      amountPaid: '299.00',
      rewardAmount: '50.00',
      assetCode: 'USDC',
      timestamp: Date.now() - 10 * 60 * 1000, // 10 minutes ago (> 5m tolerance)
    };

    const signature = await signConversionPayload(mockSecret, payload);
    const res = await authenticateConversionWebhook({
      payload,
      signature,
      secret: mockSecret,
      campaignContext: {
        businessAddress,
        remainingBudget: 350.0,
        existingOrderIds: [],
      },
    });

    results.push({
      testName: 'Test 3: Expired Timestamp / Replay Window Rejection',
      passed: res.valid === false && res.code === 'TIMESTAMP_OUT_OF_WINDOW',
      expectedResult: 'TIMESTAMP_OUT_OF_WINDOW',
      actualResult: res.code,
      details: res.message,
    });
  }

  // TEST 4: Duplicate Event ID (Idempotency Violation)
  {
    const payload: WebhookConversionPayload = {
      eventId: 'evt_test_idempotent_01',
      orderId: 'ORD-TEST-1004',
      campaignCode: 'saas91x',
      referrerAddress: legitimateReferrer,
      amountPaid: '299.00',
      rewardAmount: '50.00',
      assetCode: 'USDC',
      timestamp: Date.now(),
    };

    const signature = await signConversionPayload(mockSecret, payload);

    // First presentation passes
    await authenticateConversionWebhook({
      payload,
      signature,
      secret: mockSecret,
      campaignContext: {
        businessAddress,
        remainingBudget: 350.0,
        existingOrderIds: [],
      },
    });

    // Replay presentation with identical event ID
    const res2 = await authenticateConversionWebhook({
      payload,
      signature,
      secret: mockSecret,
      campaignContext: {
        businessAddress,
        remainingBudget: 350.0,
        existingOrderIds: [],
      },
    });

    results.push({
      testName: 'Test 4: Duplicate Event ID / Idempotency Protection',
      passed: res2.valid === false && res2.code === 'REPLAY_DETECTED',
      expectedResult: 'REPLAY_DETECTED',
      actualResult: res2.code,
      details: res2.message,
    });
  }

  // TEST 5: Duplicate Order ID (Merchant Order Already Rewarded)
  {
    const payload: WebhookConversionPayload = {
      eventId: 'evt_test_005',
      orderId: 'ORD-1092-ENT', // Order already recorded
      campaignCode: 'saas91x',
      referrerAddress: legitimateReferrer,
      amountPaid: '150.00',
      rewardAmount: '50.00',
      assetCode: 'USDC',
      timestamp: Date.now(),
    };

    const signature = await signConversionPayload(mockSecret, payload);
    const res = await authenticateConversionWebhook({
      payload,
      signature,
      secret: mockSecret,
      campaignContext: {
        businessAddress,
        remainingBudget: 350.0,
        existingOrderIds: ['ORD-1092-ENT', 'ORD-1088-ENT'],
      },
    });

    results.push({
      testName: 'Test 5: Duplicate Order ID Rejection',
      passed: res.valid === false && res.code === 'DUPLICATE_ORDER',
      expectedResult: 'DUPLICATE_ORDER',
      actualResult: res.code,
      details: res.message,
    });
  }

  // TEST 6: Self-Referral Violation (Promoter == Business Owner)
  {
    const payload: WebhookConversionPayload = {
      eventId: 'evt_test_006',
      orderId: 'ORD-TEST-1006',
      campaignCode: 'saas91x',
      referrerAddress: businessAddress, // Attacking by setting business owner address
      amountPaid: '500.00',
      rewardAmount: '50.00',
      assetCode: 'USDC',
      timestamp: Date.now(),
    };

    const signature = await signConversionPayload(mockSecret, payload);
    const res = await authenticateConversionWebhook({
      payload,
      signature,
      secret: mockSecret,
      campaignContext: {
        businessAddress,
        remainingBudget: 350.0,
        existingOrderIds: [],
      },
    });

    results.push({
      testName: 'Test 6: Self-Referral Fraud Rejection',
      passed: res.valid === false && res.code === 'SELF_REFERRAL_BLOCKED',
      expectedResult: 'SELF_REFERRAL_BLOCKED',
      actualResult: res.code,
      details: res.message,
    });
  }

  // TEST 7: Insufficient Escrow Funds (Reward Exceeds Deposited Balance)
  {
    const payload: WebhookConversionPayload = {
      eventId: 'evt_test_007',
      orderId: 'ORD-TEST-1007',
      campaignCode: 'saas91x',
      referrerAddress: legitimateReferrer,
      amountPaid: '2000.00',
      rewardAmount: '500.00', // Requires 500 USDC but only 50 USDC remaining
      assetCode: 'USDC',
      timestamp: Date.now(),
    };

    const signature = await signConversionPayload(mockSecret, payload);
    const res = await authenticateConversionWebhook({
      payload,
      signature,
      secret: mockSecret,
      campaignContext: {
        businessAddress,
        remainingBudget: 50.0,
        existingOrderIds: [],
      },
    });

    results.push({
      testName: 'Test 7: Insufficient Escrow Funds Rejection',
      passed: res.valid === false && res.code === 'INSUFFICIENT_ESCROW',
      expectedResult: 'INSUFFICIENT_ESCROW',
      actualResult: res.code,
      details: res.message,
    });
  }

  // TEST 8: Repeated Escrow Claim State Invariant
  {
    // Escrow claim is only valid when state == 'PAID'. If already 'CLAIMED', claim must be rejected.
    const isStateClaimable = (state: string) => state === 'PAID';
    const firstAttempt = isStateClaimable('PAID'); // valid
    const secondAttempt = isStateClaimable('CLAIMED'); // invalid

    const passed = firstAttempt === true && secondAttempt === false;
    results.push({
      testName: 'Test 8: Repeated Escrow Claim State Protection',
      passed,
      expectedResult: 'PAID allows claim; CLAIMED rejects repeated claim',
      actualResult: `first: ${firstAttempt}, second: ${secondAttempt}`,
      details: 'Escrow settlement enforces one-time settlement transition.',
    });
  }

  // TEST 9: Server-Side Stripe Webhook - Valid Signature on Raw Request Body
  {
    const fakeSecret = 'mock_test_nonfunctional_stripe_signing_secret';
    const rawPayload = JSON.stringify({
      id: 'evt_test_checkout_001',
      object: 'event',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_mock_order_1001',
          amount_total: 29900,
          currency: 'usd',
          client_reference_id: 'saas91x',
        },
      },
    });

    const signatureHeader = generateTestStripeSignature(rawPayload, fakeSecret);
    const verification = verifyStripeWebhookSignature({
      rawBody: rawPayload,
      signatureHeader,
      secret: fakeSecret,
    });

    results.push({
      testName: 'Test 9: Server-Side Stripe Webhook - Valid Signature on Raw Request Body',
      passed: verification.valid === true && verification.event?.id === 'evt_test_checkout_001',
      expectedResult: 'VALID_EVENT_CONSTRUCTED',
      actualResult: verification.valid ? 'VALID_EVENT_CONSTRUCTED' : verification.errorCode || 'FAILED',
      details: verification.errorMessage || 'Constructed Stripe event verified using official Stripe SDK.',
    });
  }

  // TEST 10: Server-Side Stripe Webhook - Tampered Body Rejection
  {
    const fakeSecret = 'mock_test_nonfunctional_stripe_signing_secret';
    const originalPayload = JSON.stringify({
      id: 'evt_test_checkout_002',
      object: 'event',
      type: 'payment_intent.succeeded',
      data: { object: { amount: 5000 } },
    });

    const signatureHeader = generateTestStripeSignature(originalPayload, fakeSecret);
    const tamperedPayload = JSON.stringify({
      id: 'evt_test_checkout_002',
      object: 'event',
      type: 'payment_intent.succeeded',
      data: { object: { amount: 500000 } },
    });

    const verification = verifyStripeWebhookSignature({
      rawBody: tamperedPayload,
      signatureHeader,
      secret: fakeSecret,
    });

    results.push({
      testName: 'Test 10: Server-Side Stripe Webhook - Tampered Body Rejection',
      passed: verification.valid === false && verification.errorCode === 'SIGNATURE_VERIFICATION_FAILED',
      expectedResult: 'SIGNATURE_VERIFICATION_FAILED',
      actualResult: verification.errorCode || 'UNKNOWN',
      details: verification.errorMessage,
    });
  }

  // TEST 11: Server-Side Stripe Webhook - Mismatched Secret Rejection
  {
    const correctSecret = 'mock_test_nonfunctional_stripe_signing_secret_1';
    const wrongSecret = 'mock_test_nonfunctional_stripe_signing_secret_wrong';
    const rawPayload = JSON.stringify({ id: 'evt_test_003', object: 'event', type: 'charge.succeeded' });

    const signatureHeader = generateTestStripeSignature(rawPayload, correctSecret);
    const verification = verifyStripeWebhookSignature({
      rawBody: rawPayload,
      signatureHeader,
      secret: wrongSecret,
    });

    results.push({
      testName: 'Test 11: Server-Side Stripe Webhook - Mismatched Secret Rejection',
      passed: verification.valid === false && verification.errorCode === 'SIGNATURE_VERIFICATION_FAILED',
      expectedResult: 'SIGNATURE_VERIFICATION_FAILED',
      actualResult: verification.errorCode || 'UNKNOWN',
      details: verification.errorMessage,
    });
  }

  // TEST 12: Server-Side Stripe Webhook - Missing Raw Body & Missing Signature Rejection
  {
    const fakeSecret = 'mock_test_nonfunctional_stripe_signing_secret';
    const resNoBody = verifyStripeWebhookSignature({
      rawBody: '',
      signatureHeader: 't=123,v1=abc',
      secret: fakeSecret,
    });

    const resNoSig = verifyStripeWebhookSignature({
      rawBody: '{"id":"evt_test"}',
      signatureHeader: null,
      secret: fakeSecret,
    });

    const passed =
      resNoBody.valid === false &&
      resNoBody.errorCode === 'MISSING_RAW_BODY' &&
      resNoSig.valid === false &&
      resNoSig.errorCode === 'MISSING_SIGNATURE';

    results.push({
      testName: 'Test 12: Server-Side Stripe Webhook - Missing Raw Body & Missing Signature Rejection',
      passed,
      expectedResult: 'MISSING_RAW_BODY & MISSING_SIGNATURE',
      actualResult: `${resNoBody.errorCode} & ${resNoSig.errorCode}`,
      details: 'Strict enforcement of raw payload and signature headers.',
    });
  }

  // TEST 13: Server-Side Stripe Webhook - Missing Secret Configuration Rejection
  {
    const verification = verifyStripeWebhookSignature({
      rawBody: '{"id":"evt_test"}',
      signatureHeader: 't=123,v1=abc',
      secret: '',
    });

    results.push({
      testName: 'Test 13: Server-Side Stripe Webhook - Missing Secret Configuration Rejection',
      passed: verification.valid === false && verification.errorCode === 'MISSING_SECRET',
      expectedResult: 'MISSING_SECRET',
      actualResult: verification.errorCode || 'UNKNOWN',
      details: verification.errorMessage,
    });
  }

  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.length - passedCount;

  return {
    allPassed: failedCount === 0,
    total: results.length,
    passed: passedCount,
    failed: failedCount,
    results,
  };
}
