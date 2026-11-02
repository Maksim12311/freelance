import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";

import { getDemoProfile, isDemoMode } from "@/lib/demo";
import { hasSupabaseEnv } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";

function safeInternalPath(path: string | undefined, fallback: string) {
  if (!path || !path.startsWith("/") || path.startsWith("//")) return fallback;
  return path;
}

export async function getCurrentUser(): Promise<User | null> {
  if (isDemoMode()) {
    const profile = await getDemoProfile();
    if (!profile) return null;
    return { id: profile.id, email: profile.email } as User;
  }
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
  if (isDemoMode()) {
    return getDemoProfile();
  }
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
  if (isDemoMode()) {
    const profile = await getDemoProfile();
    if (!profile) redirect(redirectTo);
    return {
      user: { id: profile.id, email: profile.email } as User,
      profile,
    };
  }

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
export async function requireProfile(intendedPath = "/dashboard"): Promise<Profile> {
  const destination = safeInternalPath(intendedPath, "/dashboard");
  const loginUrl = `/login?next=${encodeURIComponent(destination)}`;
  const { profile } = await requireUser(loginUrl);
  if (!profile) {
    redirect(loginUrl);
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

/**
 * Require a verified (non-suspended) student.
 * Unauthenticated → /login?next=<intended>
 * Unverified → /verify-student?next=<intended>
 * Admins bypass verification for moderation.
 */
export async function requireVerifiedStudent(
  intendedPath = "/dashboard",
): Promise<Profile> {
  const destination = safeInternalPath(intendedPath, "/dashboard");
  const profile = await requireProfile(destination);

  if (profile.is_admin || isVerificationActive(profile)) {
    return profile;
  }

  redirect(`/verify-student?next=${encodeURIComponent(destination)}`);
}

export async function requireAdmin(redirectTo = "/dashboard"): Promise<Profile> {
  const profile = await requireProfile("/admin");

  if (!profile.is_admin || profile.is_suspended) {
    redirect(redirectTo);
  }

  return profile;
}
