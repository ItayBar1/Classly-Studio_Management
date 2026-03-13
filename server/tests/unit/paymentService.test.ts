import { PaymentService } from '../../src/services/paymentService';

const mockPrisma: any = {
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
  $transaction: jest.fn(async (cb: any) => {
    return await cb(mockPrisma);
  }),
};

jest.mock('../../src/config/prisma', () => ({
  prisma: mockPrisma,
}));

jest.mock('../../src/logger', () => ({
  logger: {
    child: () => ({
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    }),
  },
}));

const mockStripeCreate = jest.fn();
const mockStripeRetrieve = jest.fn();
const mockConstructEvent = jest.fn();

jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    paymentIntents: {
      create: mockStripeCreate,
      retrieve: mockStripeRetrieve,
    },
    webhooks: {
      constructEvent: mockConstructEvent,
    },
  }));
});

describe('PaymentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createIntent', () => {
    it('throws if amount is invalid', async () => {
      await expect(PaymentService.createIntent(0)).rejects.toThrow('Invalid amount');
      await expect(PaymentService.createIntent(-50)).rejects.toThrow('Invalid amount');
    });

    it('creates intent via Stripe with rounded amount', async () => {
      mockStripeCreate.mockResolvedValue({ id: 'pi_test123', client_secret: 'secret_test' });
      const result = await PaymentService.createIntent(50.5);

      expect(mockStripeCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 5050,
          currency: 'ils',
        })
      );
      expect(result.clientSecret).toBe('secret_test');
    });
  });

  describe('createPaymentRecord', () => {
    it('creates a PENDING payment record in DB', async () => {
      mockPrisma.payments.create.mockResolvedValue({ id: 'pay_123', status: 'PENDING' });

      const result = await PaymentService.createPaymentRecord({
        studioId: 'studio-1',
        studentId: 'student-1',
        enrollmentId: 'enroll-1',
        amount: 100,
        stripePaymentIntentId: 'pi_test',
      });

      expect(mockPrisma.payments.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            amount_cents: 10000,
            status: 'PENDING',
          }),
        })
      );
      expect(result.id).toBe('pay_123');
    });
  });

  describe('confirmPayment', () => {
    it('throws if stripe intent status is not succeeded', async () => {
      mockStripeRetrieve.mockResolvedValue({ status: 'requires_payment_method' });
      await expect(PaymentService.confirmPayment('pi_failed')).rejects.toThrow('Payment not succeeded. Status: requires_payment_method');
    });

    it('updates payment and enrollment records on success', async () => {
      mockStripeRetrieve.mockResolvedValue({
        status: 'succeeded',
        latest_charge: 'ch_test123',
      });

      mockPrisma.payments.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.payments.findUnique.mockResolvedValue({
        id: 'pay_123',
        enrollment_id: 'enroll_123',
        status: 'SUCCEEDED'
      });
      mockPrisma.enrollments.findUnique.mockResolvedValue({
        id: 'enroll_123',
        payment_status: 'PENDING'
      });

      const result = await PaymentService.confirmPayment('pi_success');

      expect(mockPrisma.payments.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { 
            stripe_payment_intent_id: 'pi_success',
            status: 'PENDING'
          },
          data: expect.objectContaining({ status: 'SUCCEEDED' }),
        })
      );

      expect(mockPrisma.payments.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { stripe_payment_intent_id: 'pi_success' }
        })
      );

      expect(mockPrisma.enrollments.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'enroll_123' },
          data: expect.objectContaining({ status: 'ACTIVE', payment_status: 'PAID' }),
        })
      );

      expect(result.success).toBe(true);
    });

    it('handles idempotency gracefully when payment is already SUCCEEDED and ensures enrollment side-effects', async () => {
      mockStripeRetrieve.mockResolvedValue({
        status: 'succeeded',
        latest_charge: 'ch_test123',
      });

      // Simulate step 1 already happened: count is 0
      mockPrisma.payments.updateMany.mockResolvedValue({ count: 0 });
      // Payment is already SUCCEEDED
      mockPrisma.payments.findUnique.mockResolvedValue({
        id: 'pay_123',
        enrollment_id: 'enroll_123',
        status: 'SUCCEEDED'
      });
      // But enrollment was not updated yet
      mockPrisma.enrollments.findUnique.mockResolvedValue({
        id: 'enroll_123',
        payment_status: 'PENDING'
      });

      const result = await PaymentService.confirmPayment('pi_already_success');

      expect(mockPrisma.payments.updateMany).toHaveBeenCalled();
      expect(mockPrisma.enrollments.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'enroll_123' },
          data: expect.objectContaining({ status: 'ACTIVE', payment_status: 'PAID' }),
        })
      );

      expect(result.success).toBe(true);
    });
  });
});
