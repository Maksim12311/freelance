import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { PlatformNotice } from "@/components/shared/platform-notice";
import { requireProfile, isVerificationActive } from "@/lib/auth";
import { VERIFICATION_STATUS_LABELS, WORK_ELIGIBILITY_LABELS } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import { formatRelativeDate } from "@/lib/utils";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const profile = await requireProfile("/dashboard");
  const verified = isVerificationActive(profile);
  const supabase = await createClient();

  const [
    { data: myRequests },
    { data: myApplications },
    { data: notifications },
    { data: saved },
    { count: unreadMessages },
  ] = await Promise.all([
    supabase
      .from("requests")
      .select("id, title, status, created_at, application_count")
      .eq("owner_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("applications")
      .select("id, status, created_at, request:requests(id, title)")
      .eq("applicant_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("notifications")
      .select("*")
      .eq("profile_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("saved_requests")
      .select("request_id, request:requests(id, title, status)")
      .eq("profile_id", profile.id)
      .limit(5),
    supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("profile_id", profile.id)
      .eq("is_read", false)
      .eq("type", "message"),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Welcome, {profile.first_name}
          </h1>
          <p className="mt-2 text-slate-600">Your StudentPro overview for Vienna collaborations.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">
            Verification: {VERIFICATION_STATUS_LABELS[profile.verification_status]}
          </Badge>
          <Badge variant="outline">
            Work eligibility: {WORK_ELIGIBILITY_LABELS[profile.work_eligibility_status]}
          </Badge>
        </div>
      </div>

      {!verified ? (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="flex flex-wrap items-center justify-between gap-4 pt-6">
            <p className="text-sm text-amber-950">
              Verify your student status to publish requests, apply, and message other students.
            </p>
            <Button render={<Link href="/verify-student" />}>Verify now</Button>
          </CardContent>
        </Card>
      ) : null}

      <PlatformNotice />

      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Active requests", value: myRequests?.filter((r) => r.status === "open").length ?? 0 },
          { label: "Applications", value: myApplications?.length ?? 0 },
          { label: "Unread message alerts", value: unreadMessages ?? 0 },
          {
            label: "Profile",
            value: profile.profile_completed ? "Complete" : "Incomplete",
          },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">{stat.label}</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">{stat.value}</CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Active requests</CardTitle>
            <Button variant="outline" size="sm" render={<Link href="/requests/new" />}>New</Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {myRequests?.length ? (
              myRequests.map((request) => (
                <Link
                  key={request.id}
                  href={`/requests/${request.id}`}
                  className="block rounded-xl border border-slate-200 px-3 py-3 transition hover:bg-slate-50"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium">{request.title}</p>
                    <Badge variant="outline">{request.status}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {request.application_count} applications · {formatRelativeDate(request.created_at)}
                  </p>
                </Link>
              ))
            ) : (
              <EmptyState title="No requests yet" description="Post your first request to get help." />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>My applications</CardTitle>
            <Button variant="outline" size="sm" render={<Link href="/requests" />}>Browse</Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {myApplications?.length ? (
              myApplications.map((application) => {
                const request = Array.isArray(application.request)
                  ? application.request[0]
                  : application.request;
                return (
                  <div
                    key={application.id}
                    className="rounded-xl border border-slate-200 px-3 py-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium">{request?.title ?? "Request"}</p>
                      <Badge variant="secondary">{application.status}</Badge>
                    </div>
                  </div>
                );
              })
            ) : (
              <EmptyState
                title="No applications"
                description="Apply to open requests that match your skills."
              />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {notifications?.length ? (
              notifications.map((n) => (
                <div key={n.id} className="rounded-xl border border-slate-200 px-3 py-3">
                  <p className="text-sm font-medium">{n.title}</p>
                  <p className="text-xs text-slate-500">{n.body}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No notifications yet.</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Saved requests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {saved?.length ? (
              saved.map((item) => {
                const request = Array.isArray(item.request) ? item.request[0] : item.request;
                return (
                  <Link
                    key={item.request_id}
                    href={`/requests/${item.request_id}`}
                    className="block rounded-xl border border-slate-200 px-3 py-3 hover:bg-slate-50"
                  >
                    {request?.title ?? "Saved request"}
                  </Link>
                );
              })
            ) : (
              <p className="text-sm text-slate-500">No saved requests.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
