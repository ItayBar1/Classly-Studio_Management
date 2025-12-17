import { Router } from 'express';
import { WebhookController } from '../controllers/webhookController';

const router = Router();

/**
 * @route   POST /api/webhooks/stripe
 * @desc    Handle incoming Stripe webhooks
 * @access  Public (Validated by Stripe Signature)
 */
// שים לב: אנחנו לא משתמשים כאן ב-Middleware של אימות משתמש, כי הבקשה מגיעה מ-Stripe ולא מהלקוח.
// הטיפול ב-Body Parser יעשה ב-app.ts באופן ייחודי לנתיב זה.
router.post('/stripe', WebhookController.handleStripeWebhook);

export default router;