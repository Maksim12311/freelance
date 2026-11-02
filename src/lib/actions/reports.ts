"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";
import { reportSchema } from "@/lib/validations/profile";
import type { ActionResult } from "@/lib/actions/auth";

export async function createReportAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const profile = await requireProfile();
  const limited = rateLimit(`report:${profile.id}`, 10, 60_000);
  if (!limited.ok) {
    return { ok: false, error: `Too many reports. Try again in ${limited.retryAfterSec}s.` };
  }

  const parsed = reportSchema.safeParse({
    targetType: formData.get("targetType"),
    targetId: formData.get("targetId"),
    reason: formData.get("reason"),
    details: formData.get("details"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("reports").insert({
    reporter_id: profile.id,
    target_type: parsed.data.targetType,
    target_id: parsed.data.targetId,
    reason: parsed.data.reason,
    details: parsed.data.details,
    status: "open",
  });

  if (error) return { ok: false, error: error.message };
  revalidatePath("/legal/moderation");
  return {
    ok: true,
    message: "Report submitted. Our moderation team will review it.",
  };
}

export async function submitAppealAction(
  reportId: string,
  appealText: string,
): Promise<ActionResult> {
  const profile = await requireProfile();
  if (!appealText.trim() || appealText.length > 2000) {
    return { ok: false, error: "Appeal text is required (max 2000 characters)." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("reports")
    .update({
      appeal_text: appealText.trim(),
      appeal_submitted_at: new Date().toISOString(),
      status: "escalated",
    })
    .eq("id", reportId)
    .eq("reporter_id", profile.id);

  if (error) return { ok: false, error: error.message };
  return { ok: true, message: "Appeal submitted for further review." };
}
