import { z } from "zod";

export const createPaymentIntentSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  currency: z
    .string()
    .length(3, "Currency must be a 3-letter ISO code")
    .default("ils"),
  description: z.string().max(200).optional(),
  metadata: z.record(z.string()).optional(),
});

export const confirmPaymentSchema = z.object({
  paymentIntentId: z.string().min(1, "Payment Intent ID is required"),
});
