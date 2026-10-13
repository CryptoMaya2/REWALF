import type { IncomingMessage, ServerResponse } from 'node:http';
import Stripe from 'stripe';

export const config = {
  api: {
    // Disable automatic body parsing so the raw Buffer is preserved for signature verification
    bodyParser: false,
  },
};

async function getRawBody(req: IncomingMessage): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  // Allow health check on GET
  if (req.method === 'GET' || req.method === 'HEAD') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        status: 'ok',
        service: 'Rewalf Stripe Webhook Receiver',
        network: 'Stellar Testnet',
        timestamp: Date.now(),
      })
    );
    return;
  }

  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Method Not Allowed' }));
    return;
  }

  try {
    const rawBody = await getRawBody(req);
    const signature = req.headers['stripe-signature'] as string | undefined;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'STRIPE_WEBHOOK_SECRET is not configured on the server.' }));
      return;
    }

    if (!signature) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Missing stripe-signature header' }));
      return;
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
      apiVersion: '2025-02-24.acacia' as any,
    });

    const event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        received: true,
        eventType: event.type,
        eventId: event.id,
      })
    );
  } catch (err: any) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Webhook signature verification failed', message: err.message }));
  }
}
