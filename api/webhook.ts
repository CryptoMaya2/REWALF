import type { IncomingMessage, ServerResponse } from 'node:http';
import { verifyStripeWebhookSignature } from '../src/server/stripeWebhookHandler';

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
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Method Not Allowed' }));
    return;
  }

  try {
    const rawBody = await getRawBody(req);
    const signature = req.headers['stripe-signature'] as string | undefined;

    const result = verifyStripeWebhookSignature({
      rawBody,
      signatureHeader: signature,
    });

    if (!result.valid) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: result.errorMessage }));
      return;
    }

    const event = result.event!;

    // Process verified event types (e.g., checkout.session.completed)
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
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Internal Server Error', message: err.message }));
  }
}
