// server/src/routes/payments.ts
import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import dotenv from 'dotenv';

// טעינת משתני סביבה באופן מפורש בקובץ הזה
dotenv.config();

const router = Router();

// בדיקה שהמפתח קיים לפני שמנסים לאתחל
const stripeKey = process.env.STRIPE_SECRET_KEY;

if (!stripeKey) {
  console.error("FATAL ERROR: STRIPE_SECRET_KEY is missing in .env file!");
  // אנחנו לא זורקים שגיאה כאן כדי לא להפיל את כל השרת, 
  // אבל הראוטים של התשלום ייכשלו אם ייקראו.
}

// אתחול Stripe
const stripe = new Stripe(stripeKey || 'dummy_key_to_prevent_crash_on_startup', {
  apiVersion: '2025-11-17.clover', // הגרסה המעודכנת
});

// POST /api/payment/create-intent
router.post('/create-intent', async (req: Request, res: Response) => {
  try {
    // בדיקת הגנה כפולה
    if (!stripeKey) {
      return res.status(500).json({ error: 'Server configuration error: Stripe key missing' });
    }

    const { amount, currency = 'ils', description } = req.body;

    if (!amount) {
      return res.status(400).json({ error: 'Amount is required' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: currency,
      description: description,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
    });

  } catch (error: any) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;