"use server";

import { revalidatePath } from "next/cache";
import { requireVerifiedStudent } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { trackAnalyticsEvent } from "@/lib/analytics";
import type { ActionResult } from "@/lib/actions/auth";
import { z } from "zod";

const inviteSchema = z.object({
  requestId: z.uuid(),
  specialistId: z.uuid(),
  message: z.string().trim().max(1000).optional().or(z.literal("")),
});

export async function inviteSpecialistAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const profile = await requireVerifiedStudent();
  const parsed = inviteSchema.safeParse({
    requestId: formData.get("requestId"),
    specialistId: formData.get("specialistId"),
    message: formData.get("message") || "",
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  if (parsed.data.specialistId === profile.id) {
    return { ok: false, error: "You cannot invite yourself." };
  }

  const supabase = await createClient();
  const { data: request } = await supabase
    .from("requests")
    .select("id, owner_id, status, title")
    .eq("id", parsed.data.requestId)
    .maybeSingle();

  if (!request || request.owner_id !== profile.id) {
    return { ok: false, error: "Only the request owner can invite specialists." };
  }
  if (request.status !== "open") {
    return { ok: false, error: "This request is not open." };
  }

  const { data: specialist } = await supabase
    .from("profiles")
    .select("id, is_specialist_enabled, accepts_invitations, verification_status, is_suspended")
    .eq("id", parsed.data.specialistId)
    .maybeSingle();

  if (
    !specialist ||
    !specialist.is_specialist_enabled ||
    specialist.verification_status !== "verified" ||
    specialist.is_suspended
  ) {
    return { ok: false, error: "This specialist is not available for invitations." };
  }
  if (!specialist.accepts_invitations) {
    return { ok: false, error: "This specialist is not accepting invitations." };
  }

  const { error } = await supabase.from("specialist_invitations").upsert(
    {
      request_id: parsed.data.requestId,
      customer_id: profile.id,
      specialist_id: parsed.data.specialistId,
      message: parsed.data.message || null,
      status: "sent",
    },
    { onConflict: "request_id,specialist_id" },
  );

  if (error) return { ok: false, error: error.message };

  await supabase.from("notifications").insert({
    profile_id: parsed.data.specialistId,
    type: "application",
    title: "Invitation to apply",
    body: `${profile.display_name} invited you to apply to “${request.title}”. Applications are still paid separately.`,
    link_path: `/requests/${parsed.data.requestId}`,
  });

  await trackAnalyticsEvent({
    eventType: "invitation_sent",
    actorId: profile.id,
    subjectProfileId: parsed.data.specialistId,
    requestId: parsed.data.requestId,
  });
  await trackAnalyticsEvent({
    eventType: "invitation_received",
    actorId: profile.id,
    subjectProfileId: parsed.data.specialistId,
    requestId: parsed.data.requestId,
  });

  revalidatePath(`/requests/${parsed.data.requestId}`);
  revalidatePath(`/requests/${parsed.data.requestId}/suggestions`);
  return { ok: true, message: "Invitation sent (free)" };
}

export async function declineInvitationAction(invitationId: string): Promise<ActionResult> {
  const profile = await requireVerifiedStudent();
  const supabase = await createClient();
  const { error } = await supabase
    .from("specialist_invitations")
    .update({ status: "declined" })
    .eq("id", invitationId)
    .eq("specialist_id", profile.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard/specialist");
  return { ok: true, message: "Invitation declined" };
}
