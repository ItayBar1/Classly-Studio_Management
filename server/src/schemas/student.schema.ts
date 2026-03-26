import { z } from "zod";

export const createStudentSchema = z.object({
  email: z.string().email("Invalid email address"),
  full_name: z.string().min(1, "Full name is required").max(100),
  phone_number: z.string().max(20).optional(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .optional(),
});
