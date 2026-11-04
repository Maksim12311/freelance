import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import {
  CreditBackHint,
  CreditBackStatusBadge,
} from "@/components/shared/credit-back-status";
import { requireProfile } from "@/lib/auth";
import { isDemoMode, DEMO_REQUESTS, DEMO_PROFILE_ID } from "@/lib/demo";
import { getDemoCreditBackStore } from "@/lib/demo-credit-back";
import { createClient } from "@/lib/supabase/server";
import { formatRelativeDate } from "@/lib/utils";
import type { CreditBackApplication } from "@/lib/credit-back";

export const metadata = { title: "My Applications" };

type Row = {
  id: string;
  status: string;
  created_at: string;
  request: { id: string; title: string } | null;
  creditBack: Pick<
    CreditBackApplication,
    | "awaiting_customer_response"
    | "customer_responded_at"
    | "customer_response_kind"
    | "credit_refunded_at"
    | "response_deadline_at"
    | "credit_id"
    | "fee_eur"
    | "status"
  >;
};

export default async function MyApplicationsPage() {
  const profile = await requireProfile("/dashboard/applications");

  if ((profile.active_mode ?? "customer") !== "specialist") {
    redirect("/dashboard");
  }

  let applications: Row[] = [];

  if (isDemoMode()) {
    const store = getDemoCreditBackStore();
    const demoApps = store.listForApplicant(profile.id);
    applications = demoApps.map((app) => {
      const request = DEMO_REQUESTS.find((r) => r.id === app.request_id);
      return {
        id: app.id,
        status: app.status,
        created_at: app.created_at,
        request: request
          ? { id: request.id, title: request.title }
          : { id: app.request_id, title: "Demo request" },
        creditBack: app,
      };
    });

    // Seed one example row if empty so the specialist hub shows the countdown UX.
    if (!applications.length) {
      const sample = DEMO_REQUESTS.find((r) => r.owner_id !== DEMO_PROFILE_ID);
      if (sample) {
        const seeded = store.createPaidApplication({
          id: "demo-app-seed-1",
          applicantId: profile.id,
          requestId: sample.id,
          unlockedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
        });
        applications = [
          {
            id: seeded.id,
            status: seeded.status,
            created_at: seeded.created_at,
            request: { id: sample.id, title: sample.title },
            creditBack: seeded,
          },
        ];
      }
    }
  } else {
    const supabase = await createClient();
    const { data } = await supabase
      .from("applications")
      .select(
        "id, status, created_at, credit_id, fee_eur, response_deadline_at, customer_responded_at, customer_response_kind, awaiting_customer_response, credit_refunded_at, request:requests(id, title)",
      )
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
        creditBack: {
          status: application.status,
          credit_id: application.credit_id,
          fee_eur: application.fee_eur,
          response_deadline_at: application.response_deadline_at,
          customer_responded_at: application.customer_responded_at,
          customer_response_kind: application.customer_response_kind,
          awaiting_customer_response: application.awaiting_customer_response,
          credit_refunded_at: application.credit_refunded_at,
        },
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
            Track status and the 72-hour no-reply credit-back countdown.
          </p>
        </div>
        <Button variant="outline" render={<Link href="/requests" />}>
          Browse jobs
        </Button>
      </div>

      <CreditBackHint perspective="specialist" />

      {applications.length ? (
        <div className="space-y-3">
          {applications.map((application) => (
            <Link
              key={application.id}
              href={`/requests/${application.request?.id}`}
              className="flex items-center justify-between gap-3 rounded-2xl border border-[#f0d5db] bg-white/90 px-4 py-3 transition hover:border-[#fb7185]/45 hover:bg-[#fff8f9]"
            >
              <div className="min-w-0">
                <p className="font-medium text-[#2a2124]">
                  {application.request?.title ?? "Request"}
                </p>
                <p className="text-xs text-[#6f5f64]">
                  {formatRelativeDate(application.created_at)}
                </p>
              </div>
              <CreditBackStatusBadge
                application={application.creditBack}
                perspective="specialist"
              />
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
