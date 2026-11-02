"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireVerifiedStudent } from "@/lib/auth";
import { isDemoMode, setDemoActiveMode } from "@/lib/demo";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/actions/auth";

export async function switchModeAction(mode: "customer" | "specialist"): Promise<ActionResult> {
  const profile = await requireVerifiedStudent();

  if (isDemoMode()) {
    await setDemoActiveMode(mode);
  } else {
    const supabase = await createClient();
    const { error } = await supabase
      .from("profiles")
      .update(
        mode === "specialist"
          ? { active_mode: mode, is_specialist_enabled: true }
          : { active_mode: mode },
      )
      .eq("id", profile.id);
    if (error) return { ok: false, error: error.message };
  }

  revalidatePath("/", "layout");
  redirect(mode === "specialist" ? "/dashboard/specialist" : "/dashboard");
}
