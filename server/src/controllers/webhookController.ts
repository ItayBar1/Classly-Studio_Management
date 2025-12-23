import { Request, Response, NextFunction } from 'express';
import { PaymentService } from '../services/paymentService';
import { logger } from '../logger';

export class WebhookController {

    static async handleStripeWebhook(req: Request, res: Response, next: NextFunction) {
        const requestLog = req.logger || logger.child({ controller: 'WebhookController', method: 'handleStripeWebhook' });
        requestLog.info({ headers: req.headers }, 'Controller entry');
        const signature = req.headers['stripe-signature'];

        if (!signature) {
            return res.status(400).send('Missing Stripe signature');
        }

        try {
            // Verify signature and parse the body into a Stripe event
            // Note: req.body must remain a Buffer (see app.ts configuration)
            const event = PaymentService.constructEvent(req.body, signature as string);
            requestLog.info({ eventType: event.type }, 'Stripe webhook event constructed');

            // Handle relevant event types
            switch (event.type) {
                case 'payment_intent.succeeded':
                    // eslint-disable-next-line no-case-declarations
                    const paymentIntent = event.data.object as { id: string };
                    requestLog.info({ paymentIntentId: paymentIntent.id }, 'Payment succeeded event received');
                    await PaymentService.handlePaymentSuccess(paymentIntent.id);
                    break;

                case 'payment_intent.payment_failed':
                    // eslint-disable-next-line no-case-declarations
                    const failedIntent = event.data.object as { id: string };
                    requestLog.warn({ paymentIntentId: failedIntent.id }, 'Payment failed event received');
                    // Future: update status to FAILED if needed
                    break;

                default:
                    requestLog.info({ eventType: event.type }, 'Unhandled event type');
            }

            // Return success so Stripe does not resend the webhook
            res.json({ received: true });

        } catch (err: any) {
            requestLog.error({ err }, 'Error handling Stripe webhook');
            next(err);
        }
    }
}
