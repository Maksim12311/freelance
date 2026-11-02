"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireVerifiedStudent, requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { messageSchema } from "@/lib/validations/profile";
import type { ActionResult } from "@/lib/actions/auth";

export async function startConversationAction(
  otherProfileId: string,
  requestId?: string,
): Promise<ActionResult> {
  const profile = await requireVerifiedStudent("/messages");
  if (otherProfileId === profile.id) {
    return { ok: false, error: "Cannot message yourself." };
  }

  const supabase = await createClient();

  const { data: blocked } = await supabase
    .from("blocked_users")
    .select("blocker_id")
    .or(
      `and(blocker_id.eq.${profile.id},blocked_id.eq.${otherProfileId}),and(blocker_id.eq.${otherProfileId},blocked_id.eq.${profile.id})`,
    )
    .maybeSingle();

  if (blocked) {
    return { ok: false, error: "Messaging is unavailable with this user." };
  }

  const { data: existingParticipants } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("profile_id", profile.id);

  const conversationIds = (existingParticipants ?? []).map((p) => p.conversation_id);
  if (conversationIds.length) {
    const { data: shared } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("profile_id", otherProfileId)
      .in("conversation_id", conversationIds)
      .limit(1)
      .maybeSingle();

    if (shared) {
      redirect(`/messages?c=${shared.conversation_id}`);
    }
  }

  const { data: conversation, error } = await supabase
    .from("conversations")
    .insert({
      created_by: profile.id,
      request_id: requestId || null,
    })
    .select("id")
    .single();

  if (error || !conversation) {
    return { ok: false, error: error?.message ?? "Could not start conversation" };
  }

  await supabase.from("conversation_participants").insert([
    { conversation_id: conversation.id, profile_id: profile.id },
    { conversation_id: conversation.id, profile_id: otherProfileId },
  ]);

  redirect(`/messages?c=${conversation.id}`);
}

export async function sendMessageAction(formData: FormData): Promise<void> {
  const profile = await requireVerifiedStudent("/messages");
  const parsed = messageSchema.safeParse({
    conversationId: formData.get("conversationId"),
    body: formData.get("body"),
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid message");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("messages").insert({
    conversation_id: parsed.data.conversationId,
    sender_id: profile.id,
    body: parsed.data.body,
  });

  if (error) throw new Error(error.message);

  const { data: participants } = await supabase
    .from("conversation_participants")
    .select("profile_id")
    .eq("conversation_id", parsed.data.conversationId)
    .neq("profile_id", profile.id);

  if (participants?.length) {
    await supabase.from("notifications").insert(
      participants.map((p) => ({
        profile_id: p.profile_id,
        type: "message" as const,
        title: "New message",
        body: `${profile.display_name} sent you a message.`,
        link_path: `/messages?c=${parsed.data.conversationId}`,
      })),
    );
  }

  revalidatePath("/messages");
}

export async function markConversationReadAction(conversationId: string) {
  const profile = await requireProfile();
  const supabase = await createClient();
  await supabase
    .from("conversation_participants")
    .update({ last_read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .eq("profile_id", profile.id);
}

export async function blockUserAction(blockedId: string): Promise<ActionResult> {
  const profile = await requireProfile();
  if (blockedId === profile.id) return { ok: false, error: "Cannot block yourself." };
  const supabase = await createClient();
  const { error } = await supabase.from("blocked_users").upsert({
    blocker_id: profile.id,
    blocked_id: blockedId,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/settings");
  return { ok: true, message: "User blocked" };
}
