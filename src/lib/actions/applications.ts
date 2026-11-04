"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireVerifiedStudent } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { applicationSchema } from "@/lib/validations/application";
import { trackAnalyticsEvent } from "@/lib/analytics";
import {
  computeResponseDeadline,
  CREDIT_BACK_POLICY_CUSTOMER,
  DEFAULT_RESPONSE_WINDOW_HOURS,
} from "@/lib/credit-back";
import { getPricingSetting, formatEur } from "@/lib/pricing";
import { settleApplicationFee, countApplicationCredits } from "@/lib/payments";
import type { ActionResult } from "@/lib/actions/auth";

async function getResponseWindowHours(): Promise<number> {
  const setting = await getPricingSetting("application_response_window_hours");
  const hours = Number(setting.metadata?.hours ?? DEFAULT_RESPONSE_WINDOW_HOURS);
  return Number.isFinite(hours) && hours > 0 ? hours : DEFAULT_RESPONSE_WINDOW_HOURS;
}

/** Record customer response (message / accept / reject). Viewing is excluded. */
export async function markCustomerApplicationResponse(
  applicationId: string,
  kind: "message" | "accept" | "reject",
  actorId: string,
): Promise<void> {
  const { isDemoMode } = await import("@/lib/demo");
  if (isDemoMode()) {
    const { getDemoCreditBackStore } = await import("@/lib/demo-credit-back");
    getDemoCreditBackStore().markCustomerResponse(applicationId, kind);
    return;
  }

  const supabase = await createClient();
  try {
    await supabase.rpc("mark_application_customer_response", {
      p_application_id: applicationId,
      p_kind: kind,
      p_actor_id: actorId,
    });
    return;
  } catch {
    // Fallback if RPC is not yet migrated
  }

  const now = new Date().toISOString();
  await supabase
    .from("applications")
    .update({
      customer_responded_at: now,
      customer_response_kind: kind,
      awaiting_customer_response: false,
      ...(kind === "accept" ? { status: "accepted" as const } : {}),
      ...(kind === "reject" ? { status: "declined" as const } : {}),
    })
    .eq("id", applicationId)
    .is("customer_responded_at", null);
}

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

  const pricing = await getPricingSetting("application_fee");
  const windowHours = await getResponseWindowHours();
  const { isDemoMode } = await import("@/lib/demo");

  if (isDemoMode()) {
    const { getDemoCreditBackStore } = await import("@/lib/demo-credit-back");
    const store = getDemoCreditBackStore();
    if (pricing.is_enabled && pricing.amount_eur > 0) {
      const app = store.createPaidApplication({
        applicantId: profile.id,
        requestId: parsed.data.requestId,
        feeEur: pricing.amount_eur,
        windowHours,
      });
      if (!app.credit_id) {
        return {
          ok: false,
          error: "No application credits left in demo. Run the credit-back job or reset the demo store.",
        };
      }
      return {
        ok: true,
        message: `Demo application sent with 1 credit. Customer has ${windowHours}h to respond or your credit returns automatically.`,
      };
    }
    return {
      ok: true,
      message:
        "Demo mode: application recorded locally. Paid applications are currently disabled pending legal approval.",
    };
  }

  // Optional invitation link (discovery only — still paid when fees enabled)
  const { data: invitation } = await supabase
    .from("specialist_invitations")
    .select("id")
    .eq("request_id", parsed.data.requestId)
    .eq("specialist_id", profile.id)
    .in("status", ["sent", "viewed"])
    .maybeSingle();

  let paymentId: string | null = null;
  let creditId: string | null = null;
  let feeEur: number | null = null;
  let awaitingCustomerResponse = false;
  let responseDeadlineAt: string | null = null;

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
    // Credit spent → start 72h no-reply window. Manual/demo fee also starts the window
    // so specialists are not left without a response SLA when credits are unavailable.
    if (creditId || settlement.method === "manual") {
      awaitingCustomerResponse = true;
      responseDeadlineAt = computeResponseDeadline(new Date(), windowHours).toISOString();
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
      response_deadline_at: responseDeadlineAt,
      awaiting_customer_response: awaitingCustomerResponse,
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

  const deadlineNote = awaitingCustomerResponse
    ? ` Please respond within ${windowHours} hours (message, accept, or decline — viewing does not count), or their credit is returned.`
    : "";

  await supabase.from("notifications").insert({
    profile_id: request.owner_id,
    type: "application",
    title: "New application received",
    body: `${profile.display_name} applied to “${request.title}”. Messaging is unlocked.${deadlineNote}`,
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
    metadata: {
      fee_eur: feeEur,
      payment_id: paymentId,
      response_deadline_at: responseDeadlineAt,
    },
  });

  revalidatePath(`/requests/${parsed.data.requestId}`);
  revalidatePath("/dashboard/applications");
  revalidatePath("/messages");

  const feeNote =
    feeEur != null
      ? ` Fee charged: ${formatEur(feeEur)}${creditId ? " (credit)" : ""}.`
      : "";
  const policyNote = awaitingCustomerResponse
    ? ` If the customer does not respond within ${windowHours}h, your credit is returned automatically.`
    : "";
  return {
    ok: true,
    message: `Application sent. Conversation unlocked.${feeNote}${policyNote}`,
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

  const ownerRow = application.requests as
    | { owner_id: string }
    | { owner_id: string }[]
    | null;
  const ownerId = Array.isArray(ownerRow) ? ownerRow[0]?.owner_id : ownerRow?.owner_id;
  const isOwner = ownerId === profile.id;
  const isApplicant = application.applicant_id === profile.id;

  if (status === "withdrawn" && !isApplicant) {
    return { ok: false, error: "Only the applicant can withdraw." };
  }
  if (["viewed", "accepted", "declined"].includes(status) && !isOwner) {
    return { ok: false, error: "Only the request owner can update this status." };
  }

  // Viewing is informational only — it does NOT count as a customer response.
  if (status === "viewed") {
    const { error } = await supabase
      .from("applications")
      .update({ status: "viewed" })
      .eq("id", applicationId)
      .in("status", ["sent", "viewed"]);
    if (error) return { ok: false, error: error.message };
    revalidatePath(`/requests/${application.request_id}`);
    return { ok: true, message: "Marked as viewed (does not stop the credit-back countdown)." };
  }

  if (status === "accepted" || status === "declined") {
    await markCustomerApplicationResponse(
      applicationId,
      status === "accepted" ? "accept" : "reject",
      profile.id,
    );

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
    revalidatePath("/dashboard/applications");
    revalidatePath("/dashboard/requests");
    return {
      ok: true,
      message:
        status === "accepted"
          ? "Application accepted — response recorded."
          : "Application declined — response recorded.",
    };
  }

  const { error } = await supabase
    .from("applications")
    .update({ status })
    .eq("id", applicationId);

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/requests/${application.request_id}`);
  return { ok: true };
}

export async function getCreditBackPolicyCopyAction() {
  return {
    specialist: (
      await import("@/lib/credit-back")
    ).CREDIT_BACK_POLICY_SHORT,
    customer: CREDIT_BACK_POLICY_CUSTOMER,
  };
}
