import { z } from "zod";

const optionalUniversityId = z
  .union([z.uuid(), z.literal("")])
  .optional()
  .transform((value) => (value ? value : undefined));

export const loginSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const signupSchema = z
  .object({
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
    email: z.email("Enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(72, "Password is too long"),
    confirmPassword: z.string().min(1, "Confirm your password"),
    universityId: optionalUniversityId,
    acceptTerms: z.boolean().optional(),
    acceptPrivacy: z.boolean().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine((data) => data.acceptTerms !== false, {
    message: "You must accept the terms",
    path: ["acceptTerms"],
  })
  .refine((data) => data.acceptPrivacy !== false, {
    message: "You must accept the privacy policy",
    path: ["acceptPrivacy"],
  });

export const resetPasswordRequestSchema = z.object({
  email: z.email("Enter a valid email address"),
});

/** Alias used by auth server actions. */
export const forgotPasswordSchema = resetPasswordRequestSchema;

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(72, "Password is too long"),
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type ResetPasswordRequestInput = z.infer<
  typeof resetPasswordRequestSchema
>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
