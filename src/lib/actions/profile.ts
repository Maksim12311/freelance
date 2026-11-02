"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { profileUpdateSchema } from "@/lib/validations/profile";
import type { ActionResult } from "@/lib/actions/auth";

export async function updateProfileAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const profile = await requireProfile("/settings");
  const skillIds = formData.getAll("skillIds").map(String).filter(Boolean);

  const parsed = profileUpdateSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    displayName: formData.get("displayName"),
    bio: formData.get("bio"),
    generalLocation: formData.get("generalLocation"),
    availability: formData.get("availability"),
    universityId: formData.get("universityId") || null,
    skillIds,
    privacyShowInDirectory: formData.has("privacyShowInDirectory"),
    privacyShowUniversity: formData.has("privacyShowUniversity"),
    notificationEmail: formData.has("notificationEmail"),
    notificationMessages: formData.has("notificationMessages"),
    notificationApplications: formData.has("notificationApplications"),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      first_name: parsed.data.firstName,
      last_name: parsed.data.lastName,
      display_name: parsed.data.displayName,
      bio: parsed.data.bio,
      general_location: parsed.data.generalLocation,
      availability: parsed.data.availability,
      university_id: parsed.data.universityId,
      privacy_show_in_directory: parsed.data.privacyShowInDirectory ?? true,
      privacy_show_university: parsed.data.privacyShowUniversity ?? true,
      notification_email: parsed.data.notificationEmail ?? true,
      notification_messages: parsed.data.notificationMessages ?? true,
      notification_applications: parsed.data.notificationApplications ?? true,
      profile_completed: true,
    })
    .eq("id", profile.id);

  if (error) return { ok: false, error: error.message };

  if (parsed.data.skillIds) {
    await supabase.from("profile_skills").delete().eq("profile_id", profile.id);
    if (parsed.data.skillIds.length) {
      await supabase.from("profile_skills").insert(
        parsed.data.skillIds.map((skillId) => ({
          profile_id: profile.id,
          skill_id: skillId,
        })),
      );
    }
  }

  revalidatePath("/settings");
  revalidatePath(`/students/${profile.id}`);
  return { ok: true, message: "Profile updated" };
}

export async function requestDataExportAction(): Promise<void> {
  const profile = await requireProfile("/settings");
  const supabase = await createClient();

  await supabase.from("notifications").insert({
    profile_id: profile.id,
    type: "system",
    title: "Data export requested",
    body: "Your personal data export request was recorded. An administrator will process it under GDPR timelines.",
    link_path: "/settings",
  });
}

export async function deleteAccountAction(): Promise<void> {
  const profile = await requireProfile("/settings");
  const supabase = await createClient();

  // Soft-disable via security-definer RPC (users cannot set is_suspended directly).
  const { error: deleteError } = await supabase.rpc("request_account_deletion");
  if (deleteError) {
    throw new Error(deleteError.message);
  }

  try {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const admin = createAdminClient();
    await admin.auth.admin.deleteUser(profile.id);
  } catch {
    // Service role may be unset in local setups — profile is already deactivated.
  }

  await supabase.auth.signOut();
  redirect("/");
}
