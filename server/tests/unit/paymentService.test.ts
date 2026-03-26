import { PaymentService } from "../../src/services/paymentService";
import { prisma } from "../../src/config/prisma";
import Stripe from "stripe";

// jest.mock is hoisted before variable declarations, so every value referenced
// inside a factory must be defined within that factory scope.

jest.mock("../../src/config/prisma", () => {
  const prismaClient: any = {
    payments: {
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    enrollments: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(async (cb: any) => await cb(prismaClient)),
  };
  return { prisma: prismaClient };
});

jest.mock("../../src/logger", () => ({
  logger: {
    child: () => ({
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    }),
  },
}));

// Stripe is instantiated as a module-level singleton in paymentService.ts.
// The constructor runs once when the module is first imported (after jest.mock).
// We extract the mock methods from the constructed instance in beforeAll.
jest.mock("stripe", () =>
  jest.fn().mockImplementation(() => ({
    paymentIntents: {
      create: jest.fn(),
      retrieve: jest.fn(),
    },
    webhooks: {
      constructEvent: jest.fn(),
    },
  }))
);

// Aliases populated in beforeAll — available to all test bodies.
const mockPrisma = prisma as any;
let mockStripeCreate: jest.Mock;
let mockStripeRetrieve: jest.Mock;
let mockConstructEvent: jest.Mock;

beforeAll(() => {
  // Stripe constructor was called once during paymentService.ts module init.
  const stripeInstance = (Stripe as unknown as jest.Mock).mock.results[0]
    ?.value;
  mockStripeCreate = stripeInstance.paymentIntents.create;
  mockStripeRetrieve = stripeInstance.paymentIntents.retrieve;
  mockConstructEvent = stripeInstance.webhooks.constructEvent;
});

describe("PaymentService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createIntent", () => {
    it("throws if amount is invalid", async () => {
      await expect(PaymentService.createIntent(0)).rejects.toThrow(
        "Invalid amount"
      );
      await expect(PaymentService.createIntent(-50)).rejects.toThrow(
        "Invalid amount"
      );
    });

    it("creates intent via Stripe with rounded amount", async () => {
      mockStripeCreate.mockResolvedValue({
        id: "pi_test123",
        client_secret: "secret_test",
      });
      const result = await PaymentService.createIntent(50.5);

      expect(mockStripeCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 5050,
          currency: "ils",
        })
      );
      expect(result.clientSecret).toBe("secret_test");
    });
  });

  describe("createPaymentRecord", () => {
    it("creates a PENDING payment record in DB", async () => {
      mockPrisma.payments.create.mockResolvedValue({
        id: "pay_123",
        status: "PENDING",
      });

      const result = await PaymentService.createPaymentRecord({
        studioId: "studio-1",
        studentId: "student-1",
        enrollmentId: "enroll-1",
        amount: 100,
        stripePaymentIntentId: "pi_test",
      });

      expect(mockPrisma.payments.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            amount_cents: 10000,
            status: "PENDING",
          }),
        })
      );
      expect(result.id).toBe("pay_123");
    });
  });

  describe("confirmPayment", () => {
    it("throws if stripe intent status is not succeeded", async () => {
      mockStripeRetrieve.mockResolvedValue({
        status: "requires_payment_method",
      });
      await expect(PaymentService.confirmPayment("pi_failed")).rejects.toThrow(
        "Payment not succeeded. Status: requires_payment_method"
      );
    });

    it("updates payment and enrollment records on success", async () => {
      mockStripeRetrieve.mockResolvedValue({
        status: "succeeded",
        latest_charge: "ch_test123",
      });

      mockPrisma.payments.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.payments.findUnique.mockResolvedValue({
        id: "pay_123",
        enrollment_id: "enroll_123",
        status: "SUCCEEDED",
      });
      mockPrisma.enrollments.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.enrollments.findUnique.mockResolvedValue({
        id: "enroll_123",
        payment_status: "PENDING",
      });

      const result = await PaymentService.confirmPayment("pi_success");

      expect(mockPrisma.payments.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            stripe_payment_intent_id: "pi_success",
            status: "PENDING",
          },
          data: expect.objectContaining({ status: "SUCCEEDED" }),
        })
      );

      expect(mockPrisma.payments.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { stripe_payment_intent_id: "pi_success" },
        })
      );

      expect(mockPrisma.enrollments.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "enroll_123" },
          data: expect.objectContaining({
            status: "ACTIVE",
            payment_status: "PAID",
          }),
        })
      );

      expect(result.success).toBe(true);
    });

    it("handles idempotency gracefully when payment is already SUCCEEDED and ensures enrollment side-effects", async () => {
      mockStripeRetrieve.mockResolvedValue({
        status: "succeeded",
        latest_charge: "ch_test123",
      });

      // Simulate step 1 already happened: count is 0
      mockPrisma.payments.updateMany.mockResolvedValue({ count: 0 });
      // Payment is already SUCCEEDED
      mockPrisma.payments.findUnique.mockResolvedValue({
        id: "pay_123",
        enrollment_id: "enroll_123",
        status: "SUCCEEDED",
      });
      mockPrisma.enrollments.updateMany.mockResolvedValue({ count: 1 });
      // But enrollment was not updated yet
      mockPrisma.enrollments.findUnique.mockResolvedValue({
        id: "enroll_123",
        payment_status: "PENDING",
      });

      const result = await PaymentService.confirmPayment("pi_already_success");

      expect(mockPrisma.payments.updateMany).toHaveBeenCalled();
      expect(mockPrisma.enrollments.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "enroll_123" },
          data: expect.objectContaining({
            status: "ACTIVE",
            payment_status: "PAID",
          }),
        })
      );

      expect(result.success).toBe(true);
    });
  });
});
