import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { requireProfile } from "@/lib/auth";
import { DEMO_REQUESTS, isDemoMode } from "@/lib/demo";
import { createClient } from "@/lib/supabase/server";
import { formatRelativeDate } from "@/lib/utils";

export const metadata = { title: "My Requests" };

export default async function MyRequestsPage() {
  const profile = await requireProfile("/dashboard/requests");

  if ((profile.active_mode ?? "customer") === "specialist") {
    redirect("/dashboard/specialist");
  }

  let requests: Array<{
    id: string;
    title: string;
    status: string;
    application_count: number;
    created_at: string;
  }> = [];

  if (isDemoMode()) {
    requests = DEMO_REQUESTS.filter((r) => r.owner_id === profile.id).map((r) => ({
      id: r.id,
      title: r.title,
      status: r.status,
      application_count: r.application_count,
      created_at: r.created_at,
    }));
  } else {
    const supabase = await createClient();
    const { data } = await supabase
      .from("requests")
      .select("id, title, status, application_count, created_at")
      .eq("owner_id", profile.id)
      .order("created_at", { ascending: false });
    requests = data ?? [];
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-[#2a2124]">
            My requests
          </h1>
          <p className="mt-1 text-sm text-[#6f5f64]">
            Manage posts, applications, and specialist suggestions.
          </p>
        </div>
        <Button className="bg-[#e11d48] hover:bg-[#be123c]" render={<Link href="/requests/new" />}>
          New request
        </Button>
      </div>
      {requests.length ? (
        <div className="space-y-3">
          {requests.map((request) => (
            <Link
              key={request.id}
              href={`/requests/${request.id}/suggestions`}
              className="flex items-center justify-between rounded-2xl border border-[#f0d5db] bg-white/90 px-4 py-3 transition hover:border-[#fb7185]/45 hover:bg-[#fff8f9]"
            >
              <div>
                <p className="font-medium text-[#2a2124]">{request.title}</p>
                <p className="text-xs text-[#6f5f64]">
                  {request.application_count} applications · {formatRelativeDate(request.created_at)} ·
                  View suggestions
                </p>
              </div>
              <Badge className="border-transparent bg-[#ffe8ec] text-[#9f1239]">
                {request.status.replace("_", " ")}
              </Badge>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState title="No requests yet" description="Publish a request to get started." />
      )}
    </div>
  );
}
