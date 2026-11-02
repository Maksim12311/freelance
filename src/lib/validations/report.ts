import { z } from "zod";

export const reportTargetTypeSchema = z.enum([
  "request",
  "profile",
  "message",
  "review",
  "application",
]);

export const createReportSchema = z.object({
  targetType: reportTargetTypeSchema,
  targetId: z.uuid(),
  reason: z
    .string()
    .trim()
    .min(5, "Reason must be at least 5 characters")
    .max(200, "Reason must be at most 200 characters"),
  details: z
    .string()
    .trim()
    .max(2000, "Details must be at most 2000 characters")
    .optional()
    .or(z.literal("")),
});

export type CreateReportInput = z.infer<typeof createReportSchema>;
