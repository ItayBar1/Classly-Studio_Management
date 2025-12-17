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
            // אימות החתימה והמרת ה-Body לאירוע של Stripe
            // הערה: req.body כאן חייב להיות Buffer (ראה הסבר ב-app.ts)
            const event = PaymentService.constructEvent(req.body, signature as string);
            requestLog.info({ eventType: event.type }, 'Stripe webhook event constructed');

            // טיפול בסוגי האירועים השונים
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
                    // כאן אפשר להוסיף לוגיקה לעדכון סטטוס ל-FAILED
                    break;

                default:
                    requestLog.info({ eventType: event.type }, 'Unhandled event type');
            }

            // החזרת תשובה חיובית ל-Stripe כדי שלא ישלח שוב
            res.json({ received: true });

        } catch (err: any) {
            requestLog.error({ err }, 'Error handling Stripe webhook');
            next(err);
        }
    }
}