import { Router } from 'express';
import { WebhookController } from '../controllers/webhookController';

const router = Router();

/**
 * @route   POST /api/webhooks/stripe
 * @desc    Handle incoming Stripe webhooks
 * @access  Public (Validated by Stripe Signature)
 */
// Authentication middleware is not applied because requests originate from Stripe.
// Body parsing is configured in app.ts specifically for this route.
router.post('/stripe', WebhookController.handleStripeWebhook);

export default router;
