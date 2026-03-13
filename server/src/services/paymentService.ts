import { prisma } from "../config/prisma";
import Stripe from "stripe";
import { logger } from "../logger";
import { environment } from "../config/env";

const stripe = new Stripe(environment.stripe.secretKey || "", {
  apiVersion: "2026-02-25.clover",
});

export class PaymentService {
  /**
   * Create a Stripe payment intent
   */
  static async createIntent(
    amount: number,
    currency: string = "ils",
    description?: string,
    metadata?: Record<string, unknown>,
  ) {
    const serviceLogger = logger.child({
      service: "PaymentService",
      method: "createIntent",
    });
    serviceLogger.info(
      { amount, currency, description },
      "Starting createIntent",
    );

    if (!amount || amount <= 0) {
      throw new Error("Invalid amount");
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: currency,
      description: description,
      metadata: metadata as any,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    serviceLogger.info(
      { paymentIntentId: paymentIntent.id },
      "Payment intent created via Stripe",
    );
    return { clientSecret: paymentIntent.client_secret, id: paymentIntent.id };
  }

  /**
   * Create a payment record with PENDING status
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
      studioId,
      studentId,
      enrollmentId,
      amount,
      currency = "ILS",
      stripePaymentIntentId,
    } = params;

    const serviceLogger = logger.child({
      service: "PaymentService",
      method: "createPaymentRecord",
    });
    serviceLogger.info(
      { studioId, studentId, enrollmentId },
      "Creating payment record",
    );

    const data = await prisma.payments.create({
      data: {
        studio_id: studioId,
        student_id: studentId,
        enrollment_id: enrollmentId,
        amount_ils: amount,
        amount_cents: Math.round(amount * 100),
        currency: currency,
        payment_method: "STRIPE",
        stripe_payment_intent_id: stripePaymentIntentId,
        status: "PENDING",
        due_date: new Date(),
      },
    });

    return data;
  }

  /**
   * Validates a Stripe payment intent and updates local payment and enrollment records.
   * This is typically called by the frontend immediately after a successful Stripe Elements confirmation.
   * We use a conditional update (checking for PENDING status) to enforce idempotency
   * and avoid race conditions between this client-driven confirmation and the async Stripe webhook.
   * @param paymentIntentId The Stripe Payment Intent ID generated during initialization
   * @returns An object containing success status and the updated local payment record
   */
  static async confirmPayment(paymentIntentId: string) {
    const serviceLogger = logger.child({
      service: "PaymentService",
      method: "confirmPayment",
    });
    serviceLogger.info({ paymentIntentId }, "Starting confirmPayment");

    // 1. Validate against Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== "succeeded") {
      throw new Error(`Payment not succeeded. Status: ${paymentIntent.status}`);
    }

    // 2. Conditional update to enforce idempotency
    const updateResult = await prisma.payments.updateMany({
      where: { 
        stripe_payment_intent_id: paymentIntentId,
        status: "PENDING" 
      },
      data: {
        status: "SUCCEEDED",
        paid_date: new Date(),
        stripe_charge_id: paymentIntent.latest_charge as string,
        updated_at: new Date(),
      },
    });

    // Fetch the payment record (whether we updated it now or it was already updated)
    const updatedPayment = await prisma.payments.findUnique({
      where: { stripe_payment_intent_id: paymentIntentId }
    });

    if (!updatedPayment) {
      throw new Error(`Payment record not found for intent: ${paymentIntentId}`);
    }

    if (updateResult.count === 0) {
      if (updatedPayment.status !== "SUCCEEDED") {
        throw new Error(`Payment intent succeeded in Stripe, but local record is in unexpected state: ${updatedPayment.status}`);
      }
      serviceLogger.info(
        { paymentIntentId }, 
        "Payment already processed by webhook. Skipping side effects."
      );
      return { success: true, payment: updatedPayment };
    }

    // 3. Update enrollment status if available (only runs once!)
    if (updatedPayment.enrollment_id) {
      serviceLogger.info(
        { enrollmentId: updatedPayment.enrollment_id },
        "Updating enrollment after payment confirmation",
      );
      await prisma.enrollments.update({
        where: { id: updatedPayment.enrollment_id },
        data: {
          payment_status: "PAID",
          status: "ACTIVE",
          updated_at: new Date(),
        },
      });
    }

    serviceLogger.info(
      { paymentId: updatedPayment.id },
      "Payment confirmation completed",
    );
    return { success: true, payment: updatedPayment };
  }

  /**
   * Retrieve full payment history (admin)
   */
  static async getAllPayments(studioId: string) {
    const serviceLogger = logger.child({
      service: "PaymentService",
      method: "getAllPayments",
    });
    serviceLogger.info({ studioId }, "Fetching all payments for studio");

    const data = await prisma.payments.findMany({
      where: { studio_id: studioId },
      include: {
        student: {
          select: { full_name: true, email: true },
        },
        enrollment: {
          include: {
            class: {
              select: { name: true },
            },
          },
        },
      },
      orderBy: { created_at: "desc" },
    });

    serviceLogger.info(
      { count: data?.length },
      "Fetched payments successfully",
    );
    return data;
  }

  static constructEvent(payload: Buffer, signature: string) {
    const webhookSecret = environment.stripe.webhookSecret;
    const serviceLogger = logger.child({
      service: "PaymentService",
      method: "constructEvent",
    });

    if (!webhookSecret) {
      const configError = new Error("Stripe webhook secret is not configured");
      serviceLogger.error({ err: configError }, "Missing webhook secret");
      throw configError;
    }

    serviceLogger.info("Constructing Stripe webhook event");
    return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  }

  /**
   * Asynchronously handles successful payment updates received via Stripe Webhooks.
   * Ensures the system captures the payment success even if the client closes the browser
   * before `confirmPayment` is called. Uses a conditional update on the PENDING status 
   * to enforce idempotency and prevent double-processing the same payment intent.
   * @param paymentIntentId The Stripe Payment Intent ID from the webhook event
   * @returns The updated payment record
   */
  static async handlePaymentSuccess(paymentIntentId: string) {
    const serviceLogger = logger.child({
      service: "PaymentService",
      method: "handlePaymentSuccess",
    });
    serviceLogger.info(
      { paymentIntentId },
      "Handling successful payment from webhook",
    );

    // Conditional update to enforce idempotency
    const updateResult = await prisma.payments.updateMany({
      where: { 
        stripe_payment_intent_id: paymentIntentId,
        status: "PENDING" 
      },
      data: {
        status: "SUCCEEDED",
        paid_date: new Date(),
        updated_at: new Date(),
      },
    });

    const paymentRecord = await prisma.payments.findUnique({
      where: { stripe_payment_intent_id: paymentIntentId }
    });

    if (!paymentRecord) {
      throw new Error(`Payment record not found for intent: ${paymentIntentId}`);
    }

    if (updateResult.count === 0) {
      if (paymentRecord.status !== "SUCCEEDED") {
        throw new Error(`Payment intent succeeded in Stripe, but local record is in unexpected state: ${paymentRecord.status}`);
      }
      serviceLogger.info(
        { paymentIntentId }, 
        "Payment already processed by frontend confirmation. Skipping side effects."
      );
      return paymentRecord;
    }

    // Only runs if this webhook actually performed the update
    if (paymentRecord.enrollment_id) {
      serviceLogger.info(
        { enrollmentId: paymentRecord.enrollment_id },
        "Updating enrollment after webhook payment success",
      );
      await prisma.enrollments.update({
        where: { id: paymentRecord.enrollment_id },
        data: {
          payment_status: "PAID",
          status: "ACTIVE",
          updated_at: new Date(),
        },
      });
    }

    serviceLogger.info(
      { paymentId: paymentRecord.id },
      "Webhook payment handling completed",
    );
    return paymentRecord;
  }
}
