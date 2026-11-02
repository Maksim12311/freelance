"use server";

import { revalidatePath } from "next/cache";
import { requireVerifiedStudent } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { reviewSchema } from "@/lib/validations/profile";
import type { ActionResult } from "@/lib/actions/auth";

export async function confirmCollaborationAction(
  collaborationId: string,
): Promise<ActionResult> {
  const profile = await requireVerifiedStudent();
  const supabase = await createClient();

  const { data: collab } = await supabase
    .from("collaborations")
    .select("*")
    .eq("id", collaborationId)
    .maybeSingle();

  if (!collab) return { ok: false, error: "Collaboration not found" };
  if (collab.requester_id !== profile.id && collab.helper_id !== profile.id) {
    return { ok: false, error: "Not authorized" };
  }

  const now = new Date().toISOString();
  const requesterConfirmed =
    collab.requester_id === profile.id || Boolean(collab.requester_confirmed_at);
  const helperConfirmed =
    collab.helper_id === profile.id || Boolean(collab.helper_confirmed_at);
  const completed = requesterConfirmed && helperConfirmed;

  const { error } = await supabase
    .from("collaborations")
    .update({
      requester_confirmed_at:
        collab.requester_id === profile.id ? now : collab.requester_confirmed_at,
      helper_confirmed_at:
        collab.helper_id === profile.id ? now : collab.helper_confirmed_at,
      status: completed ? "completed" : "confirmed",
      completed_at: completed ? now : collab.completed_at,
    })
    .eq("id", collaborationId);

  if (error) return { ok: false, error: error.message };

  if (completed) {
    await supabase.rpc("increment_collaboration_counts", {
      p_requester: collab.requester_id,
      p_helper: collab.helper_id,
    });
  }

  revalidatePath("/dashboard");
  return { ok: true, message: "Collaboration confirmation saved" };
}

export async function createReviewAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const profile = await requireVerifiedStudent();
  const parsed = reviewSchema.safeParse({
    collaborationId: formData.get("collaborationId"),
    communicationRating: formData.get("communicationRating"),
    reliabilityRating: formData.get("reliabilityRating"),
    overallRating: formData.get("overallRating"),
    comment: formData.get("comment"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const { data: collab } = await supabase
    .from("collaborations")
    .select("*")
    .eq("id", parsed.data.collaborationId)
    .maybeSingle();

  if (!collab || collab.status !== "completed") {
    return { ok: false, error: "Reviews require a completed collaboration." };
  }
  if (collab.requester_id !== profile.id && collab.helper_id !== profile.id) {
    return { ok: false, error: "Not authorized" };
  }

  const revieweeId =
    collab.requester_id === profile.id ? collab.helper_id : collab.requester_id;

  const { error } = await supabase.from("reviews").insert({
    collaboration_id: collab.id,
    reviewer_id: profile.id,
    reviewee_id: revieweeId,
    communication_rating: parsed.data.communicationRating,
    reliability_rating: parsed.data.reliabilityRating,
    overall_rating: parsed.data.overallRating,
    comment: parsed.data.comment,
  });

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "You already reviewed this collaboration." };
    }
    return { ok: false, error: error.message };
  }

  revalidatePath(`/students/${revieweeId}`);
  return {
    ok: true,
    message:
      "Review submitted. Ratings are peer feedback, not proof of legal authorization or professional certification.",
  };
}
