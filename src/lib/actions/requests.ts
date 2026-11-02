"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireVerifiedStudent, requireProfile } from "@/lib/auth";
import { DEMO_REQUESTS, isDemoMode } from "@/lib/demo";
import { createClient } from "@/lib/supabase/server";
import { requestSchema } from "@/lib/validations/request";
import type { ActionResult } from "@/lib/actions/auth";

export async function createRequestAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const profile = await requireVerifiedStudent("/requests/new");

  const parsed = requestSchema.safeParse({
    title: formData.get("title"),
    categoryId: formData.get("categoryId"),
    description: formData.get("description"),
    suggestedBudgetEur: formData.get("suggestedBudgetEur"),
    location: formData.get("location"),
    workMode: formData.get("workMode"),
    preferredDate: formData.get("preferredDate") || null,
    acknowledgePlatform:
      formData.get("acknowledgePlatform") === "on" ||
      formData.get("acknowledgePlatform") === "true",
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  if (isDemoMode()) {
    // Preview without DB — open an existing sample request suggestions page.
    redirect(`/requests/${DEMO_REQUESTS[0].id}/suggestions`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("requests")
    .insert({
      owner_id: profile.id,
      category_id: parsed.data.categoryId,
      title: parsed.data.title,
      description: parsed.data.description,
      suggested_budget_eur: parsed.data.suggestedBudgetEur,
      location: parsed.data.location || "Vienna",
      work_mode: parsed.data.workMode,
      preferred_date: parsed.data.preferredDate || null,
      status: "open",
    })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Could not create request" };
  }

  redirect(`/requests/${data.id}/suggestions`);
}

export async function closeRequestAction(requestId: string): Promise<ActionResult> {
  const profile = await requireVerifiedStudent();
  const supabase = await createClient();

  const { error } = await supabase
    .from("requests")
    .update({
      status: "closed",
      closed_at: new Date().toISOString(),
    })
    .eq("id", requestId)
    .eq("owner_id", profile.id);

  if (error) return { ok: false, error: error.message };
  revalidatePath(`/requests/${requestId}`);
  revalidatePath("/dashboard");
  return { ok: true, message: "Request closed" };
}

export async function saveRequestAction(requestId: string): Promise<ActionResult> {
  const profile = await requireVerifiedStudent();
  const supabase = await createClient();
  const { error } = await supabase.from("saved_requests").upsert({
    profile_id: profile.id,
    request_id: requestId,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/requests/${requestId}`);
  return { ok: true };
}

export async function unsaveRequestAction(requestId: string): Promise<ActionResult> {
  const profile = await requireProfile();
  const supabase = await createClient();
  const { error } = await supabase
    .from("saved_requests")
    .delete()
    .eq("profile_id", profile.id)
    .eq("request_id", requestId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/requests/${requestId}`);
  return { ok: true };
}

export async function selectPreferredApplicantAction(
  requestId: string,
  applicantId: string,
): Promise<ActionResult> {
  const profile = await requireVerifiedStudent();
  const supabase = await createClient();

  const { error } = await supabase
    .from("requests")
    .update({
      preferred_applicant_id: applicantId,
      status: "in_progress",
    })
    .eq("id", requestId)
    .eq("owner_id", profile.id);

  if (error) return { ok: false, error: error.message };

  await supabase
    .from("applications")
    .update({ status: "accepted" })
    .eq("request_id", requestId)
    .eq("applicant_id", applicantId);

  await supabase.from("collaborations").upsert(
    {
      request_id: requestId,
      requester_id: profile.id,
      helper_id: applicantId,
      status: "pending_confirmation",
    },
    { onConflict: "request_id,helper_id" },
  );

  revalidatePath(`/requests/${requestId}`);
  return { ok: true, message: "Preferred applicant selected" };
}
