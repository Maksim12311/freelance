"use server";

import { revalidatePath } from "next/cache";
import { requireVerifiedStudent } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { applicationSchema } from "@/lib/validations/application";
import type { ActionResult } from "@/lib/actions/auth";

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
    .select("id, owner_id, status, is_hidden")
    .eq("id", parsed.data.requestId)
    .maybeSingle();

  if (!request || request.is_hidden || request.status !== "open") {
    return { ok: false, error: "This request is not open for applications." };
  }
  if (request.owner_id === profile.id) {
    return { ok: false, error: "You cannot apply to your own request." };
  }

  const { error } = await supabase.from("applications").insert({
    request_id: parsed.data.requestId,
    applicant_id: profile.id,
    introduction: parsed.data.introduction,
    experience: parsed.data.experience,
    proposed_price_eur: parsed.data.proposedPriceEur,
    availability: parsed.data.availability,
    status: "sent",
  });

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "You already applied to this request." };
    }
    return { ok: false, error: error.message };
  }

  await supabase.from("notifications").insert({
    profile_id: request.owner_id,
    type: "application",
    title: "New application received",
    body: `${profile.display_name} applied to your request.`,
    link_path: `/requests/${parsed.data.requestId}`,
  });

  revalidatePath(`/requests/${parsed.data.requestId}`);
  revalidatePath("/dashboard/applications");
  return { ok: true, message: "Application sent" };
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
  revalidatePath(`/requests/${application.request_id}`);
  return { ok: true };
}
