import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatRelativeDate } from "@/lib/utils";

export const metadata = { title: "My Requests" };

export default async function MyRequestsPage() {
  const profile = await requireProfile("/dashboard/requests");
  const supabase = await createClient();
  const { data: requests } = await supabase
    .from("requests")
    .select("id, title, status, application_count, created_at")
    .eq("owner_id", profile.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">My requests</h1>
        <Button render={<Link href="/requests/new" />}>New request</Button>
      </div>
      {requests?.length ? (
        <div className="space-y-3">
          {requests.map((request) => (
            <Link
              key={request.id}
              href={`/requests/${request.id}`}
              className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 hover:bg-slate-50"
            >
              <div>
                <p className="font-medium">{request.title}</p>
                <p className="text-xs text-slate-500">
                  {request.application_count} applications ·{" "}
                  {formatRelativeDate(request.created_at)}
                </p>
              </div>
              <Badge variant="outline">{request.status}</Badge>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState title="No requests yet" description="Publish a request to get started." />
      )}
    </div>
  );
}
