import { z } from "zod";

export const notificationSettingsSchema = z.object({
  notificationEmail: z.boolean(),
  notificationMessages: z.boolean(),
  notificationApplications: z.boolean(),
});

export const privacySettingsSchema = z.object({
  privacyShowInDirectory: z.boolean(),
  privacyShowUniversity: z.boolean(),
});

export const settingsSchema = notificationSettingsSchema.merge(
  privacySettingsSchema,
);

export type NotificationSettingsInput = z.infer<
  typeof notificationSettingsSchema
>;
export type PrivacySettingsInput = z.infer<typeof privacySettingsSchema>;
export type SettingsInput = z.infer<typeof settingsSchema>;
