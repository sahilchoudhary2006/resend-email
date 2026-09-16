import { Webhook } from 'svix';
import { prisma } from '../../utils/prisma.js';
import { config } from '../../config/index.js';
import IncomingEmailService from '../email/IncomingEmailService.js';
import MetricsService from '../metrics/MetricsService.js';

class WebhookService {
  constructor() {
    this.secret = config.webhookSecret;
  }
  verify(req) {
    let payloadString = req.body;
    if (Buffer.isBuffer(req.body)) {
      payloadString = req.body.toString('utf8');
    }

    if (!this.secret) {
      console.warn('WEBHOOK_SECRET is not set. Skipping signature verification.');
      return JSON.parse(payloadString);
    }

    const svixHeaders = {
      'svix-id': req.headers['svix-id'],
      'svix-timestamp': req.headers['svix-timestamp'],
      'svix-signature': req.headers['svix-signature'],
    };

    const wh = new Webhook(this.secret);
    wh.verify(payloadString, svixHeaders);
    return JSON.parse(payloadString);
  }

  async process(req, payload) {
    const eventId = req.headers['svix-id'] || payload.id || `evt_${Date.now()}_${Math.random()}`;

    // Check for idempotency
    const existingEvent = await prisma.webhookEvent.findUnique({
      where: { eventId }
    });

    if (existingEvent) {
      console.log(`Webhook event ${eventId} already processed. Skipping.`);
      return;
    }

    // Save event
    await prisma.webhookEvent.create({
      data: {
        eventId,
        type: payload.type || 'unknown',
        payload: JSON.stringify(payload)
      }
    });

    // Route event
    if (payload.type === 'email.received') {
      await IncomingEmailService.handleIncomingEmail(payload.data);
    } else if (payload.type.startsWith('email.')) {
      await MetricsService.processEvent(payload);
    } else {
      console.log(`Unhandled webhook event type: ${payload.type}`);
    }
  }
}

export default new WebhookService();
