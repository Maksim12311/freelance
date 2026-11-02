import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatRelativeDate } from "@/lib/utils";

export const metadata = { title: "My Applications" };

export default async function MyApplicationsPage() {
  const profile = await requireProfile("/dashboard/applications");
  const supabase = await createClient();
  const { data: applications } = await supabase
    .from("applications")
    .select("id, status, created_at, request:requests(id, title)")
    .eq("applicant_id", profile.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">My applications</h1>
      {applications?.length ? (
        <div className="space-y-3">
          {applications.map((application) => {
            const request = Array.isArray(application.request)
              ? application.request[0]
              : application.request;
            return (
              <Link
                key={application.id}
                href={`/requests/${request?.id}`}
                className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 hover:bg-slate-50"
              >
                <div>
                  <p className="font-medium">{request?.title ?? "Request"}</p>
                  <p className="text-xs text-slate-500">
                    {formatRelativeDate(application.created_at)}
                  </p>
                </div>
                <Badge variant="secondary">{application.status}</Badge>
              </Link>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="No applications"
          description="Browse open requests and send your first application."
        />
      )}
    </div>
  );
}
