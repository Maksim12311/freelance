import { z } from "zod";

const ratingSchema = z.coerce
  .number()
  .int("Rating must be a whole number")
  .min(1, "Minimum rating is 1")
  .max(5, "Maximum rating is 5");

export const createReviewSchema = z.object({
  collaborationId: z.uuid(),
  communicationRating: ratingSchema,
  reliabilityRating: ratingSchema,
  overallRating: ratingSchema,
  comment: z
    .string()
    .trim()
    .max(2000, "Comment must be at most 2000 characters")
    .optional()
    .or(z.literal("")),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
