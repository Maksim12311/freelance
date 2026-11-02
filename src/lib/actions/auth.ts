"use server";

import { redirect } from "next/navigation";
import { hasSupabaseEnv } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";
import {
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
  signupSchema,
} from "@/lib/validations/auth";

export type ActionResult = {
  ok: boolean;
  error?: string;
  message?: string;
};

const SUPABASE_SETUP_ERROR =
  "Supabase is not configured yet. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local, then restart the dev server.";

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}

export async function signupAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const limited = rateLimit(`signup:${formData.get("email")}`, 5, 60_000);
  if (!limited.ok) {
    return { ok: false, error: `Too many attempts. Try again in ${limited.retryAfterSec}s.` };
  }

  const parsed = signupSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    universityId: formData.get("universityId"),
    acceptTerms: formData.get("acceptTerms") === "on" || formData.get("acceptTerms") === "true",
    acceptPrivacy:
      formData.get("acceptPrivacy") === "on" || formData.get("acceptPrivacy") === "true",
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  if (!parsed.data.universityId) {
    return { ok: false, error: "Select a university" };
  }

  if (!hasSupabaseEnv()) {
    return { ok: false, error: SUPABASE_SETUP_ERROR };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${siteUrl()}/auth/callback`,
      data: {
        first_name: parsed.data.firstName,
        last_name: parsed.data.lastName,
        university_id: parsed.data.universityId,
      },
    },
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  const nextRaw = String(formData.get("next") || "/dashboard");
  const next = nextRaw.startsWith("/") && !nextRaw.startsWith("//") ? nextRaw : "/dashboard";
  redirect(`/verify-student?next=${encodeURIComponent(next)}`);
}

export async function loginAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const email = String(formData.get("email") ?? "");
  const limited = rateLimit(`login:${email}`, 8, 60_000);
  if (!limited.ok) {
    return { ok: false, error: `Too many attempts. Try again in ${limited.retryAfterSec}s.` };
  }

  const parsed = loginSchema.safeParse({
    email,
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  if (!hasSupabaseEnv()) {
    return { ok: false, error: SUPABASE_SETUP_ERROR };
  }

  const supabase = await createClient();
  const { data: signInData, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  const nextRaw = String(formData.get("next") || "/dashboard");
  const next = nextRaw.startsWith("/") && !nextRaw.startsWith("//") ? nextRaw : "/dashboard";

  const userId = signInData.user?.id;
  if (userId) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("verification_status, verification_expires_at, is_suspended, is_admin")
      .eq("id", userId)
      .maybeSingle();

    const verified =
      profile &&
      !profile.is_suspended &&
      (profile.is_admin ||
        (profile.verification_status === "verified" &&
          (!profile.verification_expires_at ||
            new Date(profile.verification_expires_at).getTime() > Date.now())));

    if (!verified) {
      redirect(`/verify-student?next=${encodeURIComponent(next)}`);
    }
  }

  redirect(next);
}

export async function logoutAction() {
  if (!hasSupabaseEnv()) {
    redirect("/");
  }
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function forgotPasswordAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get("email"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid email" };
  }

  const limited = rateLimit(`forgot:${parsed.data.email}`, 5, 60_000);
  if (!limited.ok) {
    return { ok: false, error: `Too many attempts. Try again in ${limited.retryAfterSec}s.` };
  }

  if (!hasSupabaseEnv()) {
    return { ok: false, error: SUPABASE_SETUP_ERROR };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${siteUrl()}/reset-password`,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  return {
    ok: true,
    message: "If an account exists for that email, a reset link has been sent.",
  };
}

export async function resetPasswordAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  if (!hasSupabaseEnv()) {
    return { ok: false, error: SUPABASE_SETUP_ERROR };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  redirect("/dashboard");
}
