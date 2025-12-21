import { supabaseAdmin } from '../config/supabase';
import Stripe from 'stripe';
import { logger } from '../logger';
import { environment } from '../config/env';

const stripe = new Stripe(environment.stripe.secretKey || '', {
  apiVersion: '2025-01-27.acacia' as any, // Ensure the version matches
});

export class PaymentService {
  
  /**
   * Create a Stripe payment intent
   */
  static async createIntent(amount: number, currency: string = 'ils', description?: string, metadata?: Record<string, unknown>) {
    const serviceLogger = logger.child({ service: 'PaymentService', method: 'createIntent' });
    serviceLogger.info({ amount, currency, description }, 'Starting createIntent');

    if (!amount || amount <= 0) {
      throw new Error('Invalid amount');
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe expects the smallest currency unit
      currency: currency,
      description: description,
      metadata: metadata as any,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    serviceLogger.info({ paymentIntentId: paymentIntent.id }, 'Payment intent created via Stripe');
    return { clientSecret: paymentIntent.client_secret, id: paymentIntent.id };
  }

  /**
   * Create a payment record with PENDING status
   * Bridges the Stripe Payment Intent with the enrollment and user
   */
  static async createPaymentRecord(params: {
    studioId: string;
    studentId: string;
    enrollmentId: string;
    amount: number;
    currency?: string;
    stripePaymentIntentId: string;
  }) {
    const { 
        studioId, studentId, enrollmentId, amount, 
        currency = 'ILS', stripePaymentIntentId 
    } = params;

    const serviceLogger = logger.child({ service: 'PaymentService', method: 'createPaymentRecord' });
    serviceLogger.info({ studioId, studentId, enrollmentId }, 'Creating payment record');

    const { data, error } = await supabaseAdmin
      .from('payments')
      .insert([{
        studio_id: studioId,
        student_id: studentId,
        enrollment_id: enrollmentId,
        amount_ils: amount,
        amount_cents: Math.round(amount * 100),
        currency: currency,
        payment_method: 'STRIPE',
        stripe_payment_intent_id: stripePaymentIntentId,
        status: 'PENDING', // Pending approval via webhook or client
        created_at: new Date()
      }])
      .select()
      .single();

    if (error) {
      serviceLogger.error({ err: error }, 'Failed to create payment record');
      throw new Error(`Failed to create payment record: ${error.message}`);
    }

    return data;
  }

  /**
   * Validate a payment and update the database
   */
  static async confirmPayment(paymentIntentId: string) {
    const serviceLogger = logger.child({ service: 'PaymentService', method: 'confirmPayment' });
    serviceLogger.info({ paymentIntentId }, 'Starting confirmPayment');

    // 1. Validate against Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      throw new Error(`Payment not succeeded. Status: ${paymentIntent.status}`);
    }

    // 2. Update payment record
    const { data: paymentRecord, error: paymentError } = await supabaseAdmin
      .from('payments')
      .update({
        status: 'SUCCEEDED',
        paid_date: new Date().toISOString(),
        stripe_charge_id: paymentIntent.latest_charge as string,
        updated_at: new Date().toISOString()
      })
      .eq('stripe_payment_intent_id', paymentIntentId)
      .select()
      .single();

    if (paymentError) {
      serviceLogger.error({ err: paymentError }, 'Failed to update payment record after confirmation');
      throw new Error(`Failed to update payment record: ${paymentError.message}`);
    }

    // 3. Update enrollment status if available
    if (paymentRecord.enrollment_id) {
      serviceLogger.info({ enrollmentId: paymentRecord.enrollment_id }, 'Updating enrollment after payment confirmation');
      await supabaseAdmin
        .from('enrollments')
        .update({
          payment_status: 'PAID',
          status: 'ACTIVE',
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentRecord.enrollment_id);
    }

    serviceLogger.info({ paymentId: paymentRecord.id }, 'Payment confirmation completed');
    return { success: true, payment: paymentRecord };
  }

  /**
   * Retrieve full payment history (admin)
   */
  static async getAllPayments(studioId: string) {
    const serviceLogger = logger.child({ service: 'PaymentService', method: 'getAllPayments' });
    serviceLogger.info({ studioId }, 'Fetching all payments for studio');

    // Assumption: payments table links to users and enrollments
    // Include student details for reporting
    const { data, error } = await supabaseAdmin
      .from('payments')
      .select(`
        *,
        student:users ( full_name, email ),
        enrollment:enrollments ( 
          class:courses ( title ) 
        )
      `)
      .eq('studio_id', studioId) // Filter by studio
      .order('created_at', { ascending: false });

    if (error) {
      serviceLogger.error({ err: error }, 'Failed to fetch payments');
      throw new Error(`Failed to fetch payments: ${error.message}`);
    }

    serviceLogger.info({ count: data?.length }, 'Fetched payments successfully');
    return data;
  }

  static constructEvent(payload: Buffer, signature: string) {
    const webhookSecret = environment.stripe.webhookSecret;
    const serviceLogger = logger.child({ service: 'PaymentService', method: 'constructEvent' });

    if (!webhookSecret) {
      const configError = new Error('Stripe webhook secret is not configured');
      serviceLogger.error({ err: configError }, 'Missing webhook secret');
      throw configError;
    }

    serviceLogger.info('Constructing Stripe webhook event');
    return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  }

  static async handlePaymentSuccess(paymentIntentId: string) {
    const serviceLogger = logger.child({ service: 'PaymentService', method: 'handlePaymentSuccess' });
    serviceLogger.info({ paymentIntentId }, 'Handling successful payment from webhook');

    const { data: paymentRecord, error: paymentError } = await supabaseAdmin
      .from('payments')
      .update({
        status: 'SUCCEEDED',
        paid_date: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('stripe_payment_intent_id', paymentIntentId)
      .select()
      .single();

    if (paymentError) {
      serviceLogger.error({ err: paymentError }, 'Failed to update payment record from webhook');
      throw new Error(`Failed to update payment record: ${paymentError.message}`);
    }

    if (paymentRecord?.enrollment_id) {
      serviceLogger.info({ enrollmentId: paymentRecord.enrollment_id }, 'Updating enrollment after webhook payment success');
      await supabaseAdmin
        .from('enrollments')
        .update({
          payment_status: 'PAID',
          status: 'ACTIVE',
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentRecord.enrollment_id);
    }

    serviceLogger.info({ paymentId: paymentRecord?.id }, 'Webhook payment handling completed');
    return paymentRecord;
  }
}
