import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicShell } from "@/components/layout/public-shell";
import { PlatformNotice } from "@/components/shared/platform-notice";
import { VerifiedBadge } from "@/components/shared/verified-badge";
import { ApplicationForm, ReportForm } from "@/components/forms/request-forms";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentProfile, isVerificationActive } from "@/lib/auth";
import { closeRequestAction, saveRequestAction, selectPreferredApplicantAction } from "@/lib/actions/requests";
import { startConversationAction } from "@/lib/actions/messages";
import { updateApplicationStatusAction } from "@/lib/actions/applications";
import { hasSupabaseEnv } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { formatBudget, formatDate } from "@/lib/utils";

export const metadata = { title: "Request details" };

export default async function RequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!hasSupabaseEnv()) {
    return (
      <PublicShell>
        <div className="mx-auto max-w-3xl px-4 py-16 text-sm text-slate-600">
          Configure Supabase credentials to view request details.
        </div>
      </PublicShell>
    );
  }

  const supabase = await createClient();
  const profile = await getCurrentProfile();
  const verified = profile ? isVerificationActive(profile) : false;

  const { data: request } = await supabase
    .from("requests")
    .select(
      "*, category:categories(name, slug), owner:profiles!requests_owner_id_fkey(id, display_name, verification_status, avatar_url, university:universities(name))",
    )
    .eq("id", id)
    .maybeSingle();

  if (!request || request.is_hidden) notFound();

  const owner = Array.isArray(request.owner) ? request.owner[0] : request.owner;
  const category = Array.isArray(request.category) ? request.category[0] : request.category;
  const isOwner = profile?.id === request.owner_id;

  const { data: applications } = isOwner
    ? await supabase
        .from("applications")
        .select(
          "id, introduction, experience, proposed_price_eur, availability, status, created_at, applicant:profiles!applications_applicant_id_fkey(id, display_name, verification_status)",
        )
        .eq("request_id", id)
        .order("created_at", { ascending: false })
    : { data: [] };

  const { data: existingApplication } =
    profile && !isOwner
      ? await supabase
          .from("applications")
          .select("id, status")
          .eq("request_id", id)
          .eq("applicant_id", profile.id)
          .maybeSingle()
      : { data: null };

  return (
    <PublicShell>
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 lg:grid-cols-[1.4fr_0.8fr] sm:px-6">
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {category ? <Badge variant="secondary">{category.name}</Badge> : null}
              <Badge variant="outline" className="capitalize">
                {request.status.replace("_", " ")}
              </Badge>
              {owner?.verification_status === "verified" ? <VerifiedBadge /> : null}
            </div>
            <h1 className="text-3xl font-semibold tracking-tight">{request.title}</h1>
            <p className="text-sm text-slate-500">
              Posted {formatDate(request.created_at)} · {request.application_count} applications
            </p>
          </div>
          <Card>
            <CardContent className="space-y-4 pt-6 text-slate-700 leading-relaxed whitespace-pre-wrap">
              {request.description}
            </CardContent>
          </Card>
          <PlatformNotice />
          {isOwner ? (
            <Card>
              <CardHeader>
                <CardTitle>Applications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {applications?.length ? (
                  applications.map((application) => {
                    const applicant = Array.isArray(application.applicant)
                      ? application.applicant[0]
                      : application.applicant;
                    return (
                      <div key={application.id} className="rounded-2xl border border-slate-200 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-medium">{applicant?.display_name}</p>
                          <Badge variant="outline">{application.status}</Badge>
                        </div>
                        <p className="mt-2 text-sm text-slate-600">{application.introduction}</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <form
                            action={async () => {
                              "use server";
                              await updateApplicationStatusAction(application.id, "viewed");
                            }}
                          >
                            <Button type="submit" size="sm" variant="outline">
                              Mark viewed
                            </Button>
                          </form>
                          {applicant?.id ? (
                            <form
                              action={async () => {
                                "use server";
                                await selectPreferredApplicantAction(id, applicant.id);
                              }}
                            >
                              <Button type="submit" size="sm">
                                Select preferred
                              </Button>
                            </form>
                          ) : null}
                          <form
                            action={async () => {
                              "use server";
                              await updateApplicationStatusAction(application.id, "declined");
                            }}
                          >
                            <Button type="submit" size="sm" variant="ghost">
                              Decline
                            </Button>
                          </form>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-slate-500">No applications yet.</p>
                )}
              </CardContent>
            </Card>
          ) : null}
        </div>

        <div className="space-y-4">
          <Card>
            <CardContent className="space-y-3 pt-6 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-slate-500">Budget</span>
                <span className="font-medium">{formatBudget(request.suggested_budget_eur)}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-slate-500">Location</span>
                <span className="font-medium">{request.location || "Vienna"}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-slate-500">Mode</span>
                <span className="font-medium capitalize">
                  {String(request.work_mode).replace("_", " ")}
                </span>
              </div>
              {request.preferred_date ? (
                <div className="flex justify-between gap-3">
                  <span className="text-slate-500">Preferred date</span>
                  <span className="font-medium">{formatDate(request.preferred_date)}</span>
                </div>
              ) : null}
              <div className="border-t border-slate-100 pt-3">
                <p className="text-slate-500">Publisher</p>
                <Link
                  href={`/students/${owner?.id}`}
                  className="mt-1 inline-flex font-medium text-[#2563EB]"
                >
                  {owner?.display_name}
                </Link>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-2">
            {isOwner ? (
              <form
                action={async () => {
                  "use server";
                  await closeRequestAction(id);
                }}
              >
                <Button type="submit" variant="outline" className="w-full">
                  Close request
                </Button>
              </form>
            ) : (
              <>
                {owner?.id ? (
                  <form
                    action={async () => {
                      "use server";
                      await startConversationAction(owner.id, id);
                    }}
                  >
                    <Button type="submit" className="w-full" disabled={!verified}>
                      Contact Student
                    </Button>
                  </form>
                ) : null}
                {profile ? (
                  <form
                    action={async () => {
                      "use server";
                      await saveRequestAction(id);
                    }}
                  >
                    <Button type="submit" variant="outline" className="w-full" disabled={!verified}>
                      Save Request
                    </Button>
                  </form>
                ) : null}
              </>
            )}
            {!profile ? (
              <Button variant="outline" render={<Link href="/login" />}>Log in to apply</Button>
            ) : null}
          </div>

          {!isOwner && verified && request.status === "open" ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Send application</CardTitle>
              </CardHeader>
              <CardContent>
                {existingApplication ? (
                  <p className="text-sm text-slate-600">
                    You already applied · status: {existingApplication.status}
                  </p>
                ) : (
                  <ApplicationForm requestId={id} />
                )}
              </CardContent>
            </Card>
          ) : null}

          {profile ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Report request</CardTitle>
              </CardHeader>
              <CardContent>
                <ReportForm targetType="request" targetId={id} />
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </PublicShell>
  );
}
