import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";

import { hasSupabaseEnv } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";

export async function getCurrentUser(): Promise<User | null> {
  if (!hasSupabaseEnv()) return null;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
}

export async function getCurrentProfile(): Promise<Profile | null> {
  if (!hasSupabaseEnv()) return null;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    return profile;
  } catch {
    return null;
  }
}

export async function requireUser(
  redirectTo = "/login",
): Promise<{ user: User; profile: Profile | null }> {
  if (!hasSupabaseEnv()) {
    redirect(redirectTo);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(redirectTo);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return { user, profile };
}

/** Require an authenticated user with a loaded profile row. */
export async function requireProfile(redirectTo = "/login"): Promise<Profile> {
  const next =
    redirectTo.startsWith("/") && !redirectTo.startsWith("/login")
      ? `/login?next=${encodeURIComponent(redirectTo)}`
      : redirectTo;
  const { profile } = await requireUser(next);
  if (!profile) {
    redirect(next);
  }
  if (profile.is_suspended) {
    redirect("/login?error=suspended");
  }
  return profile;
}

export function isVerificationActive(profile: Profile): boolean {
  if (profile.verification_status !== "verified") return false;
  if (profile.is_suspended) return false;
  if (!profile.verification_expires_at) return true;
  return new Date(profile.verification_expires_at).getTime() > Date.now();
}

export async function requireVerifiedStudent(
  redirectTo = "/verify-student",
): Promise<Profile> {
  const profile = await requireProfile(redirectTo);

  if (!isVerificationActive(profile)) {
    redirect(redirectTo);
  }

  return profile;
}

export async function requireAdmin(redirectTo = "/dashboard"): Promise<Profile> {
  const profile = await requireProfile("/admin");

  if (!profile.is_admin || profile.is_suspended) {
    redirect(redirectTo);
  }

  return profile;
}
