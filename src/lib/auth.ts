import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";

export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getCurrentProfile(): Promise<Profile | null> {
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
}

export async function requireUser(
  redirectTo = "/login",
): Promise<{ user: User; profile: Profile | null }> {
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
export async function requireProfile(
  redirectTo = "/login",
): Promise<Profile> {
  const { profile } = await requireUser(redirectTo);
  if (!profile) {
    redirect(redirectTo);
  }
  return profile;
}

function isVerificationActive(profile: Profile): boolean {
  if (profile.verification_status !== "verified") return false;
  if (profile.is_suspended) return false;
  if (!profile.verification_expires_at) return true;
  return new Date(profile.verification_expires_at).getTime() > Date.now();
}

export async function requireVerifiedStudent(
  redirectTo = "/verify-student",
): Promise<Profile> {
  const profile = await requireProfile();

  if (!isVerificationActive(profile)) {
    redirect(redirectTo);
  }

  return profile;
}

export async function requireAdmin(redirectTo = "/"): Promise<Profile> {
  const profile = await requireProfile();

  if (!profile.is_admin || profile.is_suspended) {
    redirect(redirectTo);
  }

  return profile;
}
