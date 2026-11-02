import { z } from "zod";

import { sendMessageSchema } from "@/lib/validations/message";
import { createReportSchema } from "@/lib/validations/report";
import { createReviewSchema } from "@/lib/validations/review";

const optionalUniversityId = z.preprocess(
  (value) => (value === "" || value == null ? null : value),
  z.uuid("Select a university").nullable(),
);

export const updateProfileSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, "First name is required")
    .max(50, "First name is too long"),
  lastName: z
    .string()
    .trim()
    .min(1, "Last name is required")
    .max(50, "Last name is too long"),
  displayName: z
    .string()
    .trim()
    .min(1, "Display name is required")
    .max(80, "Display name must be at most 80 characters"),
  bio: z
    .string()
    .trim()
    .max(2000, "Bio must be at most 2000 characters")
    .optional()
    .or(z.literal("")),
  universityId: optionalUniversityId.optional(),
  generalLocation: z
    .string()
    .trim()
    .max(120, "Location is too long")
    .optional()
    .or(z.literal("")),
  availability: z
    .string()
    .trim()
    .max(500, "Availability is too long")
    .optional()
    .or(z.literal("")),
  skillIds: z.array(z.uuid()).max(30, "Too many skills").optional(),
  privacyShowInDirectory: z.boolean().optional(),
  privacyShowUniversity: z.boolean().optional(),
  notificationEmail: z.boolean().optional(),
  notificationMessages: z.boolean().optional(),
  notificationApplications: z.boolean().optional(),
});

/** Alias used by profile server actions. */
export const profileUpdateSchema = updateProfileSchema;

/** Convenience re-exports — some actions import schemas from this module. */
export const messageSchema = sendMessageSchema;
export const reportSchema = createReportSchema;
export const reviewSchema = createReviewSchema;
export const verificationEmailSchema = z.object({
  universityEmail: z.email("Enter a valid university email"),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
