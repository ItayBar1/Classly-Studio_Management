import { Request, Response, NextFunction } from 'express';
import { PaymentService } from '../services/paymentService';

export class WebhookController {

    static async handleStripeWebhook(req: Request, res: Response, next: NextFunction) {
        const signature = req.headers['stripe-signature'];

        if (!signature) {
            return res.status(400).send('Missing Stripe signature');
        }

        try {
            // אימות החתימה והמרת ה-Body לאירוע של Stripe
            // הערה: req.body כאן חייב להיות Buffer (ראה הסבר ב-app.ts)
            const event = PaymentService.constructEvent(req.body, signature as string);

            // טיפול בסוגי האירועים השונים
            switch (event.type) {
                case 'payment_intent.succeeded':
                    const paymentIntent = event.data.object as any;
                    console.log(`💰 Payment succeeded: ${paymentIntent.id}`);
                    await PaymentService.handlePaymentSuccess(paymentIntent.id);
                    break;

                case 'payment_intent.payment_failed':
                    const failedIntent = event.data.object as any;
                    console.log(`❌ Payment failed: ${failedIntent.id}`);
                    // כאן אפשר להוסיף לוגיקה לעדכון סטטוס ל-FAILED
                    break;

                default:
                    console.log(`Unhandled event type ${event.type}`);
            }

            // החזרת תשובה חיובית ל-Stripe כדי שלא ישלח שוב
            res.json({ received: true });

        } catch (err: any) {
            next(err);
        }
    }
}