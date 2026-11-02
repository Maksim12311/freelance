"use server";

import { revalidatePath } from "next/cache";
import { requireVerifiedStudent } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/actions/auth";

export async function switchModeAction(mode: "customer" | "specialist"): Promise<ActionResult> {
  const profile = await requireVerifiedStudent();
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

  revalidatePath("/dashboard");
  revalidatePath("/settings");
  revalidatePath("/dashboard/specialist");
  return {
    ok: true,
    message: mode === "specialist" ? "Switched to Specialist mode" : "Switched to Customer mode",
  };
}
