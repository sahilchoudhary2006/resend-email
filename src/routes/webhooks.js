import { Router } from 'express';
import express from 'express';
import WebhookController from '../controllers/WebhookController.js';

const router = Router();

// Webhook endpoint needs raw body for signature verification
router.post('/webhooks/resend', express.raw({ type: 'application/json' }), WebhookController.handleResendWebhook);
router.post('/api/email/inbound', express.raw({ type: 'application/json' }), WebhookController.handleResendWebhook);

export default router;
