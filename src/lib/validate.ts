import { z } from "zod";

export const TaskCreateSchema = z.object({
  title: z.string().trim().min(1).max(120),
});

export const ReminderCreateSchema = z.object({
  title: z.string().trim().min(1).max(120),
  notes: z.string().trim().max(500).optional(),
  times: z
    .array(z.string().datetime())
    .min(1)
    .max(50),
});

export const DeviceUpsertSchema = z.object({
  playerId: z.string().trim().min(6).max(200),
  timezone: z.string().trim().min(3).max(64),
});
