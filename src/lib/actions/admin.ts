"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/actions/auth";

async function audit(
  adminId: string,
  action: string,
  targetType?: string,
  targetId?: string,
  metadata: Record<string, unknown> = {},
) {
  const supabase = await createClient();
  await supabase.from("admin_audit_logs").insert({
    admin_id: adminId,
    action,
    target_type: targetType ?? null,
    target_id: targetId ?? null,
    metadata,
  });
}

export async function approveVerificationAction(
  verificationId: string,
  notes?: string,
): Promise<ActionResult> {
  const admin = await requireAdmin();
  const supabase = await createClient();

  const { data: verification } = await supabase
    .from("student_verifications")
    .select("*")
    .eq("id", verificationId)
    .maybeSingle();

  if (!verification) return { ok: false, error: "Verification not found" };

  const expiresAt = new Date();
  expiresAt.setFullYear(expiresAt.getFullYear() + 1);

  const { error: vError } = await supabase
    .from("student_verifications")
    .update({
      status: "verified",
      reviewer_id: admin.id,
      review_notes: notes || null,
      reviewed_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
    })
    .eq("id", verificationId);

  if (vError) return { ok: false, error: vError.message };

  await supabase
    .from("profiles")
    .update({
      verification_status: "verified",
      verified_at: new Date().toISOString(),
      verification_expires_at: expiresAt.toISOString(),
    })
    .eq("id", verification.profile_id);

  await supabase.from("notifications").insert({
    profile_id: verification.profile_id,
    type: "verification",
    title: "Student verification approved",
    body: "Your student status was verified. You can now publish requests and message other students.",
    link_path: "/dashboard",
  });

  await audit(admin.id, "approve_verification", "student_verification", verificationId, {
    profileId: verification.profile_id,
  });

  revalidatePath("/admin");
  return { ok: true, message: "Verification approved" };
}

export async function rejectVerificationAction(
  verificationId: string,
  reason: string,
): Promise<ActionResult> {
  const admin = await requireAdmin();
  const supabase = await createClient();

  const { data: verification } = await supabase
    .from("student_verifications")
    .select("*")
    .eq("id", verificationId)
    .maybeSingle();

  if (!verification) return { ok: false, error: "Verification not found" };

  const { error } = await supabase
    .from("student_verifications")
    .update({
      status: "rejected",
      reviewer_id: admin.id,
      rejection_reason: reason,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", verificationId);

  if (error) return { ok: false, error: error.message };

  await supabase
    .from("profiles")
    .update({ verification_status: "rejected" })
    .eq("id", verification.profile_id);

  await supabase.from("notifications").insert({
    profile_id: verification.profile_id,
    type: "verification",
    title: "Verification rejected",
    body: reason || "Your verification request was rejected. You may submit again.",
    link_path: "/verify-student",
  });

  await audit(admin.id, "reject_verification", "student_verification", verificationId, {
    reason,
  });

  revalidatePath("/admin");
  return { ok: true, message: "Verification rejected" };
}

export async function moderateReportAction(
  reportId: string,
  status: "under_review" | "resolved" | "dismissed",
  resolutionNotes?: string,
): Promise<ActionResult> {
  const admin = await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("reports")
    .update({
      status,
      assigned_admin_id: admin.id,
      resolution_notes: resolutionNotes || null,
    })
    .eq("id", reportId);

  if (error) return { ok: false, error: error.message };
  await audit(admin.id, "moderate_report", "report", reportId, { status });
  revalidatePath("/admin");
  return { ok: true };
}

export async function suspendUserAction(
  userId: string,
  reason: string,
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (userId === admin.id) return { ok: false, error: "Cannot suspend yourself." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      is_suspended: true,
      suspension_reason: reason,
      privacy_show_in_directory: false,
    })
    .eq("id", userId);

  if (error) return { ok: false, error: error.message };
  await audit(admin.id, "suspend_user", "profile", userId, { reason });
  revalidatePath("/admin");
  return { ok: true, message: "Account suspended" };
}

export async function hideRequestAction(requestId: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase
    .from("requests")
    .update({ is_hidden: true, status: "cancelled" })
    .eq("id", requestId);
  if (error) return { ok: false, error: error.message };
  await audit(admin.id, "hide_request", "request", requestId);
  revalidatePath("/admin");
  return { ok: true };
}

export async function hideReviewAction(reviewId: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase
    .from("reviews")
    .update({ is_hidden: true })
    .eq("id", reviewId);
  if (error) return { ok: false, error: error.message };
  await audit(admin.id, "hide_review", "review", reviewId);
  revalidatePath("/admin");
  return { ok: true };
}

export async function upsertCategoryAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const name = String(formData.get("name") || "").trim();
  const slug = String(formData.get("slug") || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-");
  if (!name || !slug) throw new Error("Name and slug are required");

  const supabase = await createClient();
  const { error } = await supabase.from("categories").upsert(
    {
      name,
      slug,
      description: String(formData.get("description") || "") || null,
      is_active: formData.get("isActive") !== "off",
    },
    { onConflict: "slug" },
  );
  if (error) throw new Error(error.message);
  await audit(admin.id, "upsert_category", "category", undefined, { slug });
  revalidatePath("/admin");
}

export async function upsertUniversityDomainAction(
  universityId: string,
  domain: string,
): Promise<ActionResult> {
  const admin = await requireAdmin();
  const clean = domain.trim().toLowerCase();
  if (!clean) return { ok: false, error: "Domain required" };
  const supabase = await createClient();
  const { error } = await supabase.from("university_email_domains").insert({
    university_id: universityId,
    domain: clean,
    is_active: true,
  });
  if (error) return { ok: false, error: error.message };
  await audit(admin.id, "add_email_domain", "university_email_domain", universityId, {
    domain: clean,
  });
  revalidatePath("/admin");
  return { ok: true };
}

export async function updatePricingSettingAction(formData: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();
  const key = String(formData.get("key") || "").trim();
  const amount = Number(formData.get("amountEur"));
  const enabled = formData.get("isEnabled") === "on" || formData.get("isEnabled") === "true";

  if (!key) return { ok: false, error: "Pricing key required" };
  if (!Number.isFinite(amount) || amount < 0) {
    return { ok: false, error: "Amount must be a non-negative number" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("pricing_settings")
    .update({
      amount_eur: amount,
      is_enabled: enabled,
      updated_at: new Date().toISOString(),
    })
    .eq("key", key);

  if (error) return { ok: false, error: error.message };
  await audit(admin.id, "update_pricing", "pricing_settings", key, { amount, enabled });
  revalidatePath("/admin");
  return { ok: true, message: "Pricing updated" };
}

export async function grantApplicationCreditsAction(formData: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();
  const profileId = String(formData.get("profileId") || "").trim();
  const amount = Number(formData.get("amount"));
  const note = String(formData.get("note") || "").trim() || null;

  if (!profileId) return { ok: false, error: "Profile ID required" };
  if (!Number.isInteger(amount) || amount < 1 || amount > 100) {
    return { ok: false, error: "Grant between 1 and 100 credits" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("application_credits").insert({
    profile_id: profileId,
    source: "admin",
    remaining: amount,
    initial_amount: amount,
    note,
  });
  if (error) return { ok: false, error: error.message };

  await supabase.from("notifications").insert({
    profile_id: profileId,
    type: "system",
    title: "Application credits granted",
    body: `An administrator granted you ${amount} application credit${amount === 1 ? "" : "s"}.`,
    link_path: "/dashboard/specialist",
  });

  await audit(admin.id, "grant_application_credits", "profile", profileId, { amount, note });
  revalidatePath("/admin");
  return { ok: true, message: "Credits granted" };
}
