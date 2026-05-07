import { z } from "zod";

const timeRegex = /^\d{2}:\d{2}(:\d{2})?$/;

export const createClassSchema = z.object({
  name: z.string().min(1, "Class name is required").max(255),
  description: z.string().max(1000).optional(),
  instructor_id: z.string().uuid("Invalid instructor ID"),
  day_of_week: z.number().int().min(0).max(6).optional(),
  start_time: z
    .string()
    .regex(timeRegex, "start_time must be HH:MM or HH:MM:SS"),
  end_time: z.string().regex(timeRegex, "end_time must be HH:MM or HH:MM:SS"),
  max_capacity: z
    .number()
    .int()
    .positive("max_capacity must be a positive integer"),
  price_ils: z.number().nonnegative("price_ils must be non-negative"),
  location_room: z.string().max(100).optional(),
  location_building: z.string().max(100).optional(),
  level: z.string().max(20).optional(),
  billing_cycle: z.string().max(20).optional(),
  branch_id: z.string().uuid().optional().nullable(),
  category_id: z.string().uuid().optional().nullable(),
  room_id: z.string().uuid().optional().nullable(),
  age_range_min: z.number().int().min(0).optional(),
  age_range_max: z.number().int().min(0).optional(),
  ignore_warnings: z.boolean().optional(),
});

export const updateClassSchema = createClassSchema.partial();
