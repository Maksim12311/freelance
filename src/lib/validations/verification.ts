import { z } from "zod";

export const verificationMethodSchema = z.enum([
  "university_email",
  "enrollment_certificate",
]);

export const universityEmailVerificationSchema = z.object({
  method: z.literal("university_email"),
  universityEmail: z.email("Enter a valid university email"),
});

export const enrollmentCertificateVerificationSchema = z.object({
  method: z.literal("enrollment_certificate"),
  // File is validated separately (size/mime) on upload; path set after storage.
  documentPath: z.string().min(1, "Upload an enrollment document").optional(),
});

export const submitVerificationSchema = z.discriminatedUnion("method", [
  universityEmailVerificationSchema,
  enrollmentCertificateVerificationSchema,
]);

export type SubmitVerificationInput = z.infer<typeof submitVerificationSchema>;
export type VerificationEmailInput = z.infer<
  typeof universityEmailVerificationSchema
>;
