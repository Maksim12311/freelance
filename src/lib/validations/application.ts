import { z } from "zod";

export const applicationStatusSchema = z.enum([
  "sent",
  "viewed",
  "accepted",
  "declined",
  "withdrawn",
]);

const priceField = z.preprocess((value) => {
  if (value === "" || value == null) return null;
  return value;
}, z.coerce.number().min(0, "Price cannot be negative").max(100_000).nullable());

export const createApplicationSchema = z.object({
  requestId: z.uuid(),
  introduction: z
    .string()
    .trim()
    .min(20, "Introduction must be at least 20 characters")
    .max(2000, "Introduction must be at most 2000 characters"),
  experience: z
    .string()
    .trim()
    .max(2000, "Experience is too long")
    .optional()
    .or(z.literal("")),
  proposedPriceEur: priceField.optional(),
  availability: z
    .string()
    .trim()
    .max(500, "Availability is too long")
    .optional()
    .or(z.literal("")),
});

/** Alias used by application server actions. */
export const applicationSchema = createApplicationSchema;

export const updateApplicationStatusSchema = z.object({
  applicationId: z.uuid(),
  status: applicationStatusSchema,
});

export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;
export type UpdateApplicationStatusInput = z.infer<
  typeof updateApplicationStatusSchema
>;
