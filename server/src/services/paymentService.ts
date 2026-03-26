import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import Stripe from "stripe";
import { logger } from "../logger";
import { environment } from "../config/env";
import { AppError } from "../utils/AppError";

const stripe = new Stripe(environment.stripe.secretKey || "");

export class PaymentService {
  /**
   * Create a Stripe payment intent
   */
  static async createIntent(
    amount: number,
    currency: string = "ils",
    description?: string,
    metadata?: Record<string, unknown>
  ) {
    const serviceLogger = logger.child({
      service: "PaymentService",
      method: "createIntent",
    });
    serviceLogger.info(
      { amount, currency, description },
      "Starting createIntent"
    );

    if (!amount || amount <= 0) {
      throw new AppError("Invalid amount", 400);
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
      "Payment intent created via Stripe"
    );
    return { clientSecret: paymentIntent.client_secret, id: paymentIntent.id };
  }

  /**
   * Create a payment record with PENDING status
   */
  static async createPaymentRecord(
    params: {
      studioId: string;
      studentId: string;
      enrollmentId: string;
      amount: number;
      currency?: string;
      stripePaymentIntentId: string;
    },
    tx?: Prisma.TransactionClient
  ) {
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
      "Creating payment record"
    );

    const data = await (tx ?? prisma).payments.create({
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
      throw new AppError(
        `Payment not succeeded. Status: ${paymentIntent.status}`,
        422
      );
    }

    const updatedPayment = await this.processSuccessfulPayment(
      paymentIntentId,
      paymentIntent.latest_charge,
      "payment confirmation"
    );

    serviceLogger.info(
      { paymentId: updatedPayment.id },
      "Payment confirmation completed"
    );
    return { success: true, payment: updatedPayment };
  }

  private static async processSuccessfulPayment(
    paymentIntentId: string,
    latestCharge: Stripe.PaymentIntent["latest_charge"],
    source: string
  ) {
    const serviceLogger = logger.child({
      service: "PaymentService",
      method: "processSuccessfulPayment",
    });

    const paymentRecord = await prisma.$transaction(async (tx) => {
      const updateResult = await tx.payments.updateMany({
        where: {
          stripe_payment_intent_id: paymentIntentId,
          status: "PENDING",
        },
        data: {
          status: "SUCCEEDED",
          paid_date: new Date(),
          stripe_charge_id:
            typeof latestCharge === "string" ? latestCharge : latestCharge?.id,
          updated_at: new Date(),
        },
      });

      const record = await tx.payments.findUnique({
        where: { stripe_payment_intent_id: paymentIntentId },
      });

      if (!record) {
        throw new Error(
          `Payment record not found for intent: ${paymentIntentId}`
        );
      }

      if (updateResult.count === 0) {
        if (record.status !== "SUCCEEDED") {
          throw new Error(
            `Payment intent succeeded in Stripe, but local record is in unexpected state: ${record.status}`
          );
        }
        serviceLogger.info(
          { paymentIntentId },
          "Payment already processed. Ensuring side effects are complete."
        );
      }

      if (record.enrollment_id) {
        const enrollmentUpdateResult = await tx.enrollments.updateMany({
          where: {
            id: record.enrollment_id,
            payment_status: { not: "PAID" },
          },
          data: {
            payment_status: "PAID",
            status: "ACTIVE",
            updated_at: new Date(),
          },
        });

        if (enrollmentUpdateResult.count > 0) {
          serviceLogger.info(
            { enrollmentId: record.enrollment_id },
            updateResult.count === 0
              ? `Reconciling enrollment status after partial failure (${source})`
              : `Updating enrollment after successful payment (${source})`
          );
        }
      }

      return record;
    });

    return paymentRecord;
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
      "Fetched payments successfully"
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
   * @param latestCharge The latest charge object or ID associated with the payment intent
   * @returns The updated payment record
   */
  static async handlePaymentSuccess(
    paymentIntentId: string,
    latestCharge: Stripe.PaymentIntent["latest_charge"]
  ) {
    const serviceLogger = logger.child({
      service: "PaymentService",
      method: "handlePaymentSuccess",
    });
    serviceLogger.info(
      { paymentIntentId },
      "Handling successful payment from webhook"
    );

    const paymentRecord = await this.processSuccessfulPayment(
      paymentIntentId,
      latestCharge,
      "webhook"
    );

    serviceLogger.info(
      { paymentId: paymentRecord.id },
      "Webhook payment handling completed"
    );
    return paymentRecord;
  }
}
