import { z } from "zod";

export const workModeSchema = z.enum(["remote", "in_person", "hybrid"]);

export const requestStatusSchema = z.enum([
  "open",
  "in_progress",
  "closed",
  "cancelled",
]);

const budgetField = z.preprocess((value) => {
  if (value === "" || value == null) return null;
  return value;
}, z.coerce.number().min(0, "Budget cannot be negative").max(100_000).nullable());

export const createRequestSchema = z.object({
  title: z
    .string()
    .trim()
    .min(5, "Title must be at least 5 characters")
    .max(120, "Title must be at most 120 characters"),
  description: z
    .string()
    .trim()
    .min(30, "Description must be at least 30 characters")
    .max(5000, "Description must be at most 5000 characters"),
  categoryId: z.uuid("Select a category"),
  suggestedBudgetEur: budgetField.optional(),
  location: z
    .string()
    .trim()
    .max(120, "Location is too long")
    .optional()
    .or(z.literal("")),
  workMode: workModeSchema.default("in_person"),
  preferredDate: z
    .union([
      z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD"),
      z.literal(""),
      z.null(),
    ])
    .optional()
    .transform((value) => (value ? value : null)),
  acknowledgePlatform: z.boolean().optional(),
});

/** Alias used by request server actions. */
export const requestSchema = createRequestSchema;

export const updateRequestSchema = createRequestSchema.partial().extend({
  status: requestStatusSchema.optional(),
});

export const requestFiltersSchema = z.object({
  q: z.string().trim().max(120).optional(),
  categoryId: z.uuid().optional(),
  workMode: workModeSchema.optional(),
  minBudget: z.coerce.number().min(0).optional(),
  maxBudget: z.coerce.number().min(0).optional(),
  status: requestStatusSchema.optional(),
});

export type CreateRequestInput = z.infer<typeof createRequestSchema>;
export type UpdateRequestInput = z.infer<typeof updateRequestSchema>;
export type RequestFiltersInput = z.infer<typeof requestFiltersSchema>;
