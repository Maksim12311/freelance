import { SiteHeader } from "@/components/layout/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { requireAdmin } from "@/lib/auth";
import {
  approveVerificationAction,
  hideRequestAction,
  hideReviewAction,
  moderateReportAction,
  rejectVerificationAction,
  suspendUserAction,
  upsertCategoryAction,
  upsertUniversityDomainAction,
} from "@/lib/actions/admin";
import { createClient } from "@/lib/supabase/server";
import { formatRelativeDate } from "@/lib/utils";

export const metadata = { title: "Admin" };

export default async function AdminPage() {
  const admin = await requireAdmin();
  const supabase = await createClient();

  const [
    { count: usersCount },
    { count: requestsCount },
    { count: openReports },
    { count: pendingVerifications },
    { data: verifications },
    { data: reports },
    { data: users },
    { data: categories },
    { data: universities },
    { data: auditLogs },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("requests").select("*", { count: "exact", head: true }),
    supabase
      .from("reports")
      .select("*", { count: "exact", head: true })
      .in("status", ["open", "under_review", "escalated"]),
    supabase
      .from("student_verifications")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending_review"),
    supabase
      .from("student_verifications")
      .select(
        "id, method, status, university_email, document_path, submitted_at, profile:profiles(id, display_name, email)",
      )
      .eq("status", "pending_review")
      .order("submitted_at", { ascending: true })
      .limit(20),
    supabase
      .from("reports")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("profiles")
      .select("id, display_name, email, verification_status, is_suspended, is_admin, created_at")
      .order("created_at", { ascending: false })
      .limit(30),
    supabase.from("categories").select("*").order("sort_order"),
    supabase.from("universities").select("id, name").order("name"),
    supabase
      .from("admin_audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  return (
    <>
      <SiteHeader
        user={{
          id: admin.id,
          displayName: admin.display_name,
          isAdmin: true,
          verified: true,
        }}
      />
      <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-10 sm:px-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Admin dashboard</h1>
          <p className="mt-2 text-slate-600">
            Verification review, moderation, and platform configuration. Users cannot self-assign
            admin roles.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-4">
          {[
            { label: "Users", value: usersCount ?? 0 },
            { label: "Requests", value: requestsCount ?? 0 },
            { label: "Pending verifications", value: pendingVerifications ?? 0 },
            { label: "Open reports", value: openReports ?? 0 },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-slate-500">{stat.label}</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold">{stat.value}</CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Student verification queue</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {verifications?.length ? (
              verifications.map((item) => {
                const profile = Array.isArray(item.profile) ? item.profile[0] : item.profile;
                return (
                  <div key={item.id} className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-medium">{profile?.display_name}</p>
                        <p className="text-xs text-slate-500">
                          {item.method} · {profile?.email} ·{" "}
                          {formatRelativeDate(item.submitted_at)}
                        </p>
                        {item.university_email ? (
                          <p className="text-xs text-slate-500">Uni email: {item.university_email}</p>
                        ) : null}
                        {item.document_path ? (
                          <p className="text-xs text-slate-500">
                            Private document path: {item.document_path}
                          </p>
                        ) : null}
                      </div>
                      <Badge>pending</Badge>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <form
                        action={async () => {
                          "use server";
                          await approveVerificationAction(item.id);
                        }}
                      >
                        <Button type="submit" size="sm">
                          Approve
                        </Button>
                      </form>
                      <form
                        action={async (formData) => {
                          "use server";
                          await rejectVerificationAction(
                            item.id,
                            String(formData.get("reason") || "Rejected"),
                          );
                        }}
                        className="flex gap-2"
                      >
                        <Input name="reason" placeholder="Rejection reason" required />
                        <Button type="submit" size="sm" variant="outline">
                          Reject
                        </Button>
                      </form>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-slate-500">No pending verifications.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Reports</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {reports?.length ? (
              reports.map((report) => (
                <div key={report.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium">
                      {report.target_type} · {report.reason}
                    </p>
                    <Badge variant="outline">{report.status}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{report.details}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <form
                      action={async () => {
                        "use server";
                        await moderateReportAction(report.id, "under_review");
                      }}
                    >
                      <Button size="sm" variant="outline" type="submit">
                        Under review
                      </Button>
                    </form>
                    <form
                      action={async () => {
                        "use server";
                        await moderateReportAction(report.id, "resolved", "Resolved by admin");
                      }}
                    >
                      <Button size="sm" type="submit">
                        Resolve
                      </Button>
                    </form>
                    <form
                      action={async () => {
                        "use server";
                        await moderateReportAction(report.id, "dismissed", "Dismissed");
                      }}
                    >
                      <Button size="sm" variant="ghost" type="submit">
                        Dismiss
                      </Button>
                    </form>
                    {report.target_type === "request" ? (
                      <form
                        action={async () => {
                          "use server";
                          await hideRequestAction(report.target_id);
                        }}
                      >
                        <Button size="sm" variant="destructive" type="submit">
                          Hide request
                        </Button>
                      </form>
                    ) : null}
                    {report.target_type === "review" ? (
                      <form
                        action={async () => {
                          "use server";
                          await hideReviewAction(report.target_id);
                        }}
                      >
                        <Button size="sm" variant="destructive" type="submit">
                          Hide review
                        </Button>
                      </form>
                    ) : null}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No reports.</p>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Users</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {users?.map((user) => (
                <div
                  key={user.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 p-3"
                >
                  <div>
                    <p className="font-medium">{user.display_name}</p>
                    <p className="text-xs text-slate-500">
                      {user.email} · {user.verification_status}
                      {user.is_admin ? " · admin" : ""}
                      {user.is_suspended ? " · suspended" : ""}
                    </p>
                  </div>
                  {!user.is_admin ? (
                    <form
                      action={async (formData) => {
                        "use server";
                        await suspendUserAction(
                          user.id,
                          String(formData.get("reason") || "Suspended by admin"),
                        );
                      }}
                      className="flex gap-2"
                    >
                      <Input name="reason" placeholder="Reason" required />
                      <Button size="sm" variant="destructive" type="submit">
                        Suspend
                      </Button>
                    </form>
                  ) : null}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Categories & domains</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <form action={upsertCategoryAction} className="space-y-2">
                <Input name="name" placeholder="Category name" required />
                <Input name="slug" placeholder="slug" required />
                <Textarea name="description" placeholder="Description" />
                <Button type="submit" size="sm">
                  Save category
                </Button>
              </form>
              <ul className="space-y-1 text-sm text-slate-600">
                {categories?.map((c) => (
                  <li key={c.id}>
                    {c.name} ({c.slug})
                  </li>
                ))}
              </ul>
              <form
                action={async (formData) => {
                  "use server";
                  await upsertUniversityDomainAction(
                    String(formData.get("universityId")),
                    String(formData.get("domain")),
                  );
                }}
                className="space-y-2"
              >
                <select
                  name="universityId"
                  required
                  className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm"
                >
                  {universities?.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
                <Input name="domain" placeholder="student.example.ac.at" required />
                <Button type="submit" size="sm">
                  Add email domain
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Audit log</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {auditLogs?.map((log) => (
              <div key={log.id} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
                <span className="font-medium">{log.action}</span>
                <span className="text-slate-500">
                  {" "}
                  · {log.target_type} · {formatRelativeDate(log.created_at)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
