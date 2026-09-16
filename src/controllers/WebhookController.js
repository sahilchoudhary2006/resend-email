import WebhookService from '../services/webhook/WebhookService.js';

class WebhookController {
  async handleResendWebhook(req, res) {
    try {
      // 1. Verify signature synchronously (will throw if invalid)
      const payload = WebhookService.verify(req);

      // 2. Respond 200 OK to Resend immediately
      res.status(200).json({ received: true });

      // 3. Process asynchronously
      WebhookService.process(req, payload).catch(err => {
        console.error('Webhook async processing error:', err.message);
      });
    } catch (err) {
      console.error('Webhook verification failed:', err.message);
      if (!res.headersSent) {
        res.status(401).json({ error: 'Webhook signature verification failed' });
      }
    }
  }
}

export default new WebhookController();
