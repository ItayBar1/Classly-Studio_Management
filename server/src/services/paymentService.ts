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
   * Validate a payment and update the database
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

    // 2. Update payment record using unique constraint (eliminates race condition)
    const updatedPayment = await prisma.payments.update({
      where: { stripe_payment_intent_id: paymentIntentId },
      data: {
        status: "SUCCEEDED",
        paid_date: new Date(),
        stripe_charge_id: paymentIntent.latest_charge as string,
        updated_at: new Date(),
      },
    });

    // 3. Update enrollment status if available
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

  static async handlePaymentSuccess(paymentIntentId: string) {
    const serviceLogger = logger.child({
      service: "PaymentService",
      method: "handlePaymentSuccess",
    });
    serviceLogger.info(
      { paymentIntentId },
      "Handling successful payment from webhook",
    );

    // Update payment record using unique constraint (eliminates race condition)
    const paymentRecord = await prisma.payments.update({
      where: { stripe_payment_intent_id: paymentIntentId },
      data: {
        status: "SUCCEEDED",
        paid_date: new Date(),
        updated_at: new Date(),
      },
    });

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
