"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import {
  ALLOWED_VERIFICATION_MIME,
  MAX_VERIFICATION_DOCUMENT_BYTES,
} from "@/lib/constants";
import { rateLimit } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";
import { verificationEmailSchema } from "@/lib/validations/profile";
import type { ActionResult } from "@/lib/actions/auth";

export async function submitUniversityEmailVerificationAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const profile = await requireProfile("/verify-student");
  const limited = rateLimit(`verify-email:${profile.id}`, 5, 60_000);
  if (!limited.ok) {
    return { ok: false, error: `Too many attempts. Try again in ${limited.retryAfterSec}s.` };
  }

  const parsed = verificationEmailSchema.safeParse({
    universityEmail: formData.get("universityEmail"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid email" };
  }

  const domain = parsed.data.universityEmail.split("@")[1]?.toLowerCase();
  if (!domain) return { ok: false, error: "Invalid university email" };

  const supabase = await createClient();
  const { data: allowed } = await supabase
    .from("university_email_domains")
    .select("id, university_id, domain")
    .ilike("domain", domain)
    .eq("is_active", true)
    .maybeSingle();

  if (!allowed) {
    return {
      ok: false,
      error:
        "This email domain is not on the approved university allowlist. Use an enrollment certificate or contact support.",
    };
  }

  // Evidence of control: send a confirmation link via Supabase to that address is ideal.
  // MVP stores pending verification for admin/automated confirmation of domain ownership.
  const { error } = await supabase.from("student_verifications").insert({
    profile_id: profile.id,
    method: "university_email",
    status: "pending_review",
    university_email: parsed.data.universityEmail,
  });

  if (error) return { ok: false, error: error.message };

  // Profile verification_status is synced by a security-definer DB trigger.
  revalidatePath("/verify-student");
  revalidatePath("/dashboard");
  return {
    ok: true,
    message:
      "University email submitted for verification. An administrator will review affiliation evidence. This is not proof of work authorization.",
  };
}

export async function submitEnrollmentDocumentAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const profile = await requireProfile("/verify-student");
  const limited = rateLimit(`verify-doc:${profile.id}`, 5, 60_000);
  if (!limited.ok) {
    return { ok: false, error: `Too many attempts. Try again in ${limited.retryAfterSec}s.` };
  }

  const file = formData.get("document");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Please upload a PDF, JPG, or PNG file." };
  }
  if (file.size > MAX_VERIFICATION_DOCUMENT_BYTES) {
    return { ok: false, error: "File must be 10 MB or smaller." };
  }
  if (!ALLOWED_VERIFICATION_MIME.includes(file.type as (typeof ALLOWED_VERIFICATION_MIME)[number])) {
    return { ok: false, error: "Only PDF, JPG, and PNG files are allowed." };
  }

  const supabase = await createClient();
  const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
  const path = `${profile.id}/${Date.now()}.${ext}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  const { error: uploadError } = await supabase.storage
    .from("verification-documents")
    .upload(path, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return { ok: false, error: uploadError.message };
  }

  const { error } = await supabase.from("student_verifications").insert({
    profile_id: profile.id,
    method: "enrollment_certificate",
    status: "pending_review",
    document_path: path,
    document_mime_type: file.type,
    document_size_bytes: file.size,
  });

  if (error) return { ok: false, error: error.message };

  // Profile verification_status is synced by a security-definer DB trigger.
  revalidatePath("/verify-student");
  revalidatePath("/dashboard");
  return {
    ok: true,
    message:
      "Enrollment document uploaded privately. Only administrators can access it during review.",
  };
}
