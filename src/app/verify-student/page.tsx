import { redirect } from "next/navigation";
import { PublicShell } from "@/components/layout/public-shell";
import { PlatformNotice } from "@/components/shared/platform-notice";
import { VerificationForms } from "@/components/forms/verification-forms";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { isVerificationActive, requireProfile } from "@/lib/auth";
import { VERIFICATION_STATUS_LABELS } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Verify Student Status" };

export default async function VerifyStudentPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const profile = await requireProfile("/verify-student");
  const params = await searchParams;
  const next =
    params.next && params.next.startsWith("/") && !params.next.startsWith("//")
      ? params.next
      : "/dashboard";

  if (isVerificationActive(profile) || profile.is_admin) {
    redirect(next);
  }

  const supabase = await createClient();
  const { data: latest } = await supabase
    .from("student_verifications")
    .select("*")
    .eq("profile_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <PublicShell>
      <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-12 sm:px-6">
        <div className="space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight">
            Verification required
          </h1>
          <p className="text-slate-600">
            StudentPro is a private marketplace. Only verified students can browse requests,
            view student profiles, message others, apply, or post a request.
          </p>
          <Badge variant="secondary">
            Current status: {VERIFICATION_STATUS_LABELS[profile.verification_status]}
          </Badge>
          {params.next ? (
            <p className="text-sm text-slate-500">
              After verification you will continue to{" "}
              <span className="font-medium text-slate-700">{next}</span>.
            </p>
          ) : null}
        </div>

        <PlatformNotice title="Verification is not work authorization">
          University affiliation checks do not prove current enrollment in every case and never
          prove authorization to perform paid work under Austrian law. An optional work eligibility
          status may be reviewed separately and is not official government authorization.
        </PlatformNotice>

        {latest ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Latest submission</CardTitle>
              <CardDescription>
                Method: {latest.method.replace("_", " ")} · Status:{" "}
                {VERIFICATION_STATUS_LABELS[latest.status]}
                {latest.rejection_reason ? ` · ${latest.rejection_reason}` : ""}
              </CardDescription>
            </CardHeader>
            {latest.status === "pending_review" ? (
              <CardContent>
                <p className="text-sm text-slate-600">
                  Your submission is waiting for review. Marketplace access unlocks after
                  approval.
                </p>
              </CardContent>
            ) : null}
          </Card>
        ) : null}

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Method A — University email</CardTitle>
              <CardDescription>
                Use an address on the approved university domain allowlist. Not every .ac.at domain
                is accepted.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <VerificationForms mode="email" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Method B — Enrollment certificate</CardTitle>
              <CardDescription>
                Upload PDF, JPG, or PNG (max 10 MB). Documents are private — never exposed via
                public URLs.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <VerificationForms mode="document" />
            </CardContent>
          </Card>
        </div>
      </div>
    </PublicShell>
  );
}
