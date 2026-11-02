import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { requireProfile } from "@/lib/auth";
import { isDemoMode } from "@/lib/demo";
import { createClient } from "@/lib/supabase/server";
import { formatRelativeDate } from "@/lib/utils";

export const metadata = { title: "My Applications" };

export default async function MyApplicationsPage() {
  const profile = await requireProfile("/dashboard/applications");

  if ((profile.active_mode ?? "customer") !== "specialist") {
    redirect("/dashboard");
  }

  let applications: Array<{
    id: string;
    status: string;
    created_at: string;
    request: { id: string; title: string } | null;
  }> = [];

  if (!isDemoMode()) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("applications")
      .select("id, status, created_at, request:requests(id, title)")
      .eq("applicant_id", profile.id)
      .order("created_at", { ascending: false });
    applications = (data ?? []).map((application) => {
      const request = Array.isArray(application.request)
        ? application.request[0]
        : application.request;
      return {
        id: application.id,
        status: application.status,
        created_at: application.created_at,
        request: request ? { id: request.id, title: request.title } : null,
      };
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-[#2a2124]">
            My applications
          </h1>
          <p className="mt-1 text-sm text-[#6f5f64]">
            Track sent applications and unlock messaging after payment.
          </p>
        </div>
        <Button variant="outline" render={<Link href="/requests" />}>
          Browse jobs
        </Button>
      </div>
      {applications.length ? (
        <div className="space-y-3">
          {applications.map((application) => (
            <Link
              key={application.id}
              href={`/requests/${application.request?.id}`}
              className="flex items-center justify-between rounded-2xl border border-[#f0d5db] bg-white/90 px-4 py-3 transition hover:border-[#fb7185]/45 hover:bg-[#fff8f9]"
            >
              <div>
                <p className="font-medium text-[#2a2124]">
                  {application.request?.title ?? "Request"}
                </p>
                <p className="text-xs text-[#6f5f64]">
                  {formatRelativeDate(application.created_at)}
                </p>
              </div>
              <Badge variant="secondary">{application.status}</Badge>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No applications yet"
          description="Browse open requests and apply — invitation not required."
        />
      )}
    </div>
  );
}
