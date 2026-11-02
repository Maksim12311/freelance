"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireVerifiedStudent } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { applicationSchema } from "@/lib/validations/application";
import { trackAnalyticsEvent } from "@/lib/analytics";
import { getPricingSetting, formatEur } from "@/lib/pricing";
import { settleApplicationFee, countApplicationCredits } from "@/lib/payments";
import type { ActionResult } from "@/lib/actions/auth";

async function unlockConversation(
  supabase: Awaited<ReturnType<typeof createClient>>,
  applicantId: string,
  ownerId: string,
  requestId: string,
) {
  const { data: existingParticipants } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("profile_id", applicantId);

  const conversationIds = (existingParticipants ?? []).map((p) => p.conversation_id);
  if (conversationIds.length) {
    const { data: shared } = await supabase
      .from("conversation_participants")
      .select("conversation_id, conversation:conversations(id, request_id)")
      .eq("profile_id", ownerId)
      .in("conversation_id", conversationIds);

    const match = (shared ?? []).find((row) => {
      const conv = Array.isArray(row.conversation) ? row.conversation[0] : row.conversation;
      return conv?.request_id === requestId;
    });
    if (match) return match.conversation_id;
  }

  const { data: conversation } = await supabase
    .from("conversations")
    .insert({
      created_by: applicantId,
      request_id: requestId,
    })
    .select("id")
    .single();

  if (!conversation) return null;

  await supabase.from("conversation_participants").insert([
    { conversation_id: conversation.id, profile_id: applicantId },
    { conversation_id: conversation.id, profile_id: ownerId },
  ]);

  return conversation.id;
}

export async function getApplicationFeePreviewAction(): Promise<{
  amountEur: number;
  formatted: string;
  enabled: boolean;
  credits: number;
}> {
  const profile = await requireVerifiedStudent();
  const pricing = await getPricingSetting("application_fee");
  const credits = await countApplicationCredits(profile.id);
  return {
    amountEur: pricing.amount_eur,
    formatted: formatEur(pricing.amount_eur),
    enabled: pricing.is_enabled,
    credits,
  };
}

export async function submitApplicationAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const profile = await requireVerifiedStudent();

  const parsed = applicationSchema.safeParse({
    requestId: formData.get("requestId"),
    introduction: formData.get("introduction"),
    experience: formData.get("experience"),
    proposedPriceEur: formData.get("proposedPriceEur"),
    availability: formData.get("availability"),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const { data: request } = await supabase
    .from("requests")
    .select("id, owner_id, status, is_hidden, title")
    .eq("id", parsed.data.requestId)
    .maybeSingle();

  if (!request || request.is_hidden || request.status !== "open") {
    return { ok: false, error: "This request is not open for applications." };
  }
  if (request.owner_id === profile.id) {
    return { ok: false, error: "You cannot apply to your own request." };
  }

  const { data: existing } = await supabase
    .from("applications")
    .select("id")
    .eq("request_id", parsed.data.requestId)
    .eq("applicant_id", profile.id)
    .maybeSingle();

  if (existing) {
    return { ok: false, error: "You already applied to this request." };
  }

  const { isDemoMode } = await import("@/lib/demo");
  if (isDemoMode()) {
    return {
      ok: true,
      message:
        "Demo mode: application recorded locally (no database). Messaging would unlock after payment in production.",
    };
  }

  // Optional invitation link (discovery only — still paid)
  const { data: invitation } = await supabase
    .from("specialist_invitations")
    .select("id")
    .eq("request_id", parsed.data.requestId)
    .eq("specialist_id", profile.id)
    .in("status", ["sent", "viewed"])
    .maybeSingle();

  const pricing = await getPricingSetting("application_fee");
  let paymentId: string | null = null;
  let creditId: string | null = null;
  let feeEur: number | null = null;

  if (pricing.is_enabled && pricing.amount_eur > 0) {
    feeEur = pricing.amount_eur;
    const settlement = await settleApplicationFee({
      profileId: profile.id,
      requestId: parsed.data.requestId,
      amountEur: pricing.amount_eur,
      preferCredit: true,
    });

    if (!settlement.ok) {
      return { ok: false, error: settlement.error };
    }

    if (settlement.method === "stripe") {
      // Store draft intent in payment metadata; complete after webhook.
      await supabase
        .from("application_payments")
        .update({
          metadata: {
            pending_application: {
              introduction: parsed.data.introduction,
              experience: parsed.data.experience || null,
              proposed_price_eur: parsed.data.proposedPriceEur ?? null,
              availability: parsed.data.availability || null,
              invitation_id: invitation?.id ?? null,
            },
          },
        })
        .eq("id", settlement.paymentId);
      redirect(settlement.checkoutUrl);
    }

    paymentId = settlement.paymentId;
    if (settlement.method === "credit") {
      creditId = settlement.creditId || null;
    }
  }

  const now = new Date().toISOString();
  const { data: application, error } = await supabase
    .from("applications")
    .insert({
      request_id: parsed.data.requestId,
      applicant_id: profile.id,
      introduction: parsed.data.introduction,
      experience: parsed.data.experience || null,
      proposed_price_eur: parsed.data.proposedPriceEur,
      availability: parsed.data.availability || null,
      status: "sent",
      invitation_id: invitation?.id ?? null,
      payment_id: paymentId,
      credit_id: creditId,
      fee_eur: feeEur,
      messaging_unlocked: true,
      unlocked_at: now,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "You already applied to this request." };
    }
    return { ok: false, error: error.message };
  }

  if (paymentId && application) {
    await supabase
      .from("application_payments")
      .update({ application_id: application.id })
      .eq("id", paymentId);
  }

  if (invitation) {
    await supabase
      .from("specialist_invitations")
      .update({ status: "applied" })
      .eq("id", invitation.id);
  }

  const conversationId = await unlockConversation(
    supabase,
    profile.id,
    request.owner_id,
    parsed.data.requestId,
  );

  await supabase.from("notifications").insert({
    profile_id: request.owner_id,
    type: "application",
    title: "New application received",
    body: `${profile.display_name} applied to “${request.title}”. Messaging is unlocked.`,
    link_path: conversationId
      ? `/messages?c=${conversationId}`
      : `/requests/${parsed.data.requestId}`,
  });

  await trackAnalyticsEvent({
    eventType: "application_sent",
    actorId: profile.id,
    subjectProfileId: profile.id,
    requestId: parsed.data.requestId,
    applicationId: application?.id,
    metadata: { fee_eur: feeEur, payment_id: paymentId },
  });

  revalidatePath(`/requests/${parsed.data.requestId}`);
  revalidatePath("/dashboard/applications");
  revalidatePath("/messages");

  const feeNote =
    feeEur != null
      ? ` Fee charged: ${formatEur(feeEur)}${creditId ? " (credit)" : ""}.`
      : "";
  return {
    ok: true,
    message: `Application sent. Conversation unlocked.${feeNote}`,
  };
}

export async function updateApplicationStatusAction(
  applicationId: string,
  status: "viewed" | "accepted" | "declined" | "withdrawn",
): Promise<ActionResult> {
  const profile = await requireVerifiedStudent();
  const supabase = await createClient();

  const { data: application } = await supabase
    .from("applications")
    .select("id, applicant_id, request_id, requests(owner_id)")
    .eq("id", applicationId)
    .maybeSingle();

  if (!application) return { ok: false, error: "Application not found" };

  const ownerId = (application.requests as { owner_id: string } | null)?.owner_id;
  const isOwner = ownerId === profile.id;
  const isApplicant = application.applicant_id === profile.id;

  if (status === "withdrawn" && !isApplicant) {
    return { ok: false, error: "Only the applicant can withdraw." };
  }
  if (["viewed", "accepted", "declined"].includes(status) && !isOwner) {
    return { ok: false, error: "Only the request owner can update this status." };
  }

  const { error } = await supabase
    .from("applications")
    .update({ status })
    .eq("id", applicationId);

  if (error) return { ok: false, error: error.message };

  if (status === "accepted") {
    await trackAnalyticsEvent({
      eventType: "application_accepted",
      actorId: profile.id,
      subjectProfileId: application.applicant_id,
      requestId: application.request_id,
      applicationId,
    });
  }

  revalidatePath(`/requests/${application.request_id}`);
  return { ok: true };
}
