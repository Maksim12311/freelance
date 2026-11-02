import { z } from "zod";

export const sendMessageSchema = z.object({
  conversationId: z.uuid(),
  body: z
    .string()
    .trim()
    .min(1, "Message cannot be empty")
    .max(5000, "Message must be at most 5000 characters"),
});

export const createConversationSchema = z.object({
  participantId: z.uuid(),
  requestId: z.uuid().optional().nullable(),
  body: z
    .string()
    .trim()
    .min(1, "Message cannot be empty")
    .max(5000, "Message must be at most 5000 characters")
    .optional(),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type CreateConversationInput = z.infer<typeof createConversationSchema>;
