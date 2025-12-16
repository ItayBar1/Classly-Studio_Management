import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import dotenv from 'dotenv';
import { logger } from '../logger';

// Explicitly load environment variables for this module
dotenv.config();

const router = Router();

// Validate the API key before initializing Stripe
const stripeKey = process.env.STRIPE_SECRET_KEY;

if (!stripeKey) {
  logger.error('FATAL ERROR: STRIPE_SECRET_KEY is missing in .env file!');
  // We do not throw here to keep the server running,
  // but payment routes will fail if they are called.
}

// Initialize Stripe with a safe fallback key to avoid crashes on startup
const stripe = new Stripe(stripeKey || 'dummy_key_to_prevent_crash_on_startup', {
  apiVersion: '2025-11-17.clover', // Updated API version
});

// POST /api/payment/create-intent
router.post('/create-intent', async (req: Request, res: Response) => {
  const requestLog = req.logger || logger.child({ route: 'create-intent' });
  requestLog.info('Received request to create payment intent');

  try {
    // Double-check configuration safety
    if (!stripeKey) {
      requestLog.error('Stripe key missing during intent creation');
      return res.status(500).json({ error: 'Server configuration error: Stripe key missing' });
    }

    const { amount, currency = 'ils', description } = req.body;
    requestLog.info({ amount, currency, hasDescription: Boolean(description) }, 'Validating request payload');

    if (!amount) {
      requestLog.warn('Payment intent creation failed: amount missing');
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

    requestLog.info({ paymentIntentId: paymentIntent.id }, 'Payment intent created successfully');

    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error: any) {
    requestLog.error({ err: error }, 'Error creating payment intent');
    res.status(500).json({ error: error.message });
  }
});

export default router;