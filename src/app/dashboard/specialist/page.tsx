import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MatchReasons } from "@/components/shared/match-reasons";
import { EmptyState } from "@/components/shared/empty-state";
import { requireVerifiedStudent } from "@/lib/auth";
import {
  cancelPlusAction,
  deletePortfolioItemAction,
  purchaseProfileBoostAction,
  subscribePlusAction,
} from "@/lib/actions/specialist";
import { declineInvitationAction } from "@/lib/actions/invitations";
import { getRecommendedRequestsForSpecialist } from "@/lib/matching-data";
import { getPricingSetting, formatEur } from "@/lib/pricing";
import { hasActiveBoost, hasActivePlus, countApplicationCredits } from "@/lib/payments";
import { createClient } from "@/lib/supabase/server";
import { formatBudget, formatRelativeDate } from "@/lib/utils";
import { PortfolioAddForm, SpecialistProfileForm } from "@/components/forms/specialist-forms";
import { redirect } from "next/navigation";

export const metadata = { title: "Specialist mode" };

export default async function SpecialistDashboardPage() {
  const profile = await requireVerifiedStudent("/dashboard/specialist");
  const supabase = await createClient();

  // Mode changes only via switchModeAction (cookie/DB writes are not allowed during render).
  if (profile.active_mode !== "specialist") {
    redirect("/dashboard");
  }

  const [
    recommended,
    boostActive,
    plusActive,
    credits,
    boostPricing,
    plusPricing,
    { data: portfolio },
    { data: invitations },
    { data: skills },
    { data: selectedSkills },
    { data: activeBoost },
    { data: activeSub },
  ] = await Promise.all([
    getRecommendedRequestsForSpecialist(profile.id, { limit: 10 }),
    hasActiveBoost(profile.id),
    hasActivePlus(profile.id),
    countApplicationCredits(profile.id),
    getPricingSetting("profile_boost_7d"),
    getPricingSetting("plus_monthly"),
    supabase
      .from("portfolio_items")
      .select("*")
      .eq("profile_id", profile.id)
      .order("sort_order"),
    supabase
      .from("specialist_invitations")
      .select(
        "id, status, message, created_at, request:requests(id, title, status, suggested_budget_eur)",
      )
      .eq("specialist_id", profile.id)
      .in("status", ["sent", "viewed"])
      .order("created_at", { ascending: false })
      .limit(10),
    supabase.from("skills").select("id, name").eq("is_active", true).order("name"),
    supabase.from("profile_skills").select("skill_id").eq("profile_id", profile.id),
    supabase
      .from("profile_boosts")
      .select("ends_at")
      .eq("profile_id", profile.id)
      .eq("status", "active")
      .order("ends_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("user_subscriptions")
      .select("current_period_end, cancel_at_period_end, status")
      .eq("profile_id", profile.id)
      .in("status", ["active", "trialing"])
      .order("current_period_end", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const selectedSkillIds = (selectedSkills ?? []).map((s) => s.skill_id);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-[#2a2124]">
          Specialist hub
        </h1>
        <p className="mt-2 text-[#6f5f64]">
          Offer services, apply to requests, boost visibility, and track real performance.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: "Mode", value: profile.is_specialist_enabled ? "Enabled" : "Setup needed" },
          { label: "App credits", value: credits },
          {
            label: "Boost",
            value: boostActive
              ? `Until ${activeBoost?.ends_at ? new Date(activeBoost.ends_at).toLocaleDateString("de-AT") : "active"}`
              : "Off",
          },
          {
            label: "Plus",
            value: plusActive
              ? activeSub?.cancel_at_period_end
                ? "Cancelling"
                : "Active"
              : "Off",
          },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">{stat.label}</CardTitle>
            </CardHeader>
            <CardContent className="text-lg font-semibold">{stat.value}</CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recommended requests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recommended.length ? (
              recommended.map((row) => (
                <Link
                  key={row.item.id}
                  href={`/requests/${row.item.id}`}
                  className="block rounded-xl border border-slate-200 px-3 py-3 transition hover:bg-slate-50"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium">{row.item.title}</p>
                    <Badge variant="outline">
                      {formatBudget(row.item.suggested_budget_eur)}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {row.item.category_name ?? "Category"} · {row.item.location || "Vienna"} ·{" "}
                    {row.item.work_mode.replace("_", " ")}
                  </p>
                  <MatchReasons reasons={row.reasons} />
                </Link>
              ))
            ) : (
              <EmptyState
                title="No personalized matches yet"
                description="Complete your specialist profile and skills to see recommended requests."
              />
            )}
            <Button variant="outline" size="sm" render={<Link href="/requests" />}>
              Browse all requests
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Invitations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {invitations?.length ? (
              invitations.map((inv) => {
                const request = Array.isArray(inv.request) ? inv.request[0] : inv.request;
                return (
                  <div key={inv.id} className="rounded-xl border border-slate-200 px-3 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium">{request?.title ?? "Request"}</p>
                      <Badge variant="secondary">{inv.status}</Badge>
                    </div>
                    {inv.message ? (
                      <p className="mt-1 text-sm text-slate-600">{inv.message}</p>
                    ) : null}
                    <p className="mt-1 text-xs text-slate-500">
                      {formatRelativeDate(inv.created_at)} · Apply still requires the fee
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {request?.id ? (
                        <Button size="sm" render={<Link href={`/requests/${request.id}`} />}>
                          Open request
                        </Button>
                      ) : null}
                      <form
                        action={async () => {
                          "use server";
                          await declineInvitationAction(inv.id);
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
              <p className="text-sm text-slate-500">No open invitations.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profile boost</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-600">
            <p>
              Higher placement in relevant recommendations for{" "}
              {Number(boostPricing.metadata.duration_days ?? 7)} days. Labeled Sponsored. Does not
              override relevance.
            </p>
            <p className="font-medium text-slate-900">{formatEur(boostPricing.amount_eur)}</p>
            {boostActive ? (
              <Badge>Boost active</Badge>
            ) : (
              <form
                action={async () => {
                  "use server";
                  await purchaseProfileBoostAction();
                }}
              >
                <Button type="submit" disabled={!boostPricing.is_enabled}>
                  Buy boost
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>StudentPro Plus</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-600">
            <p>
              Modest visibility, advanced analytics, and request alerts.{" "}
              <strong className="font-medium text-slate-800">Applications are charged separately.</strong>
            </p>
            <p className="font-medium text-slate-900">
              {formatEur(plusPricing.amount_eur)}/month
            </p>
            {plusActive ? (
              <div className="space-y-2">
                <Badge variant="secondary">
                  Active until{" "}
                  {activeSub?.current_period_end
                    ? new Date(activeSub.current_period_end).toLocaleDateString("de-AT")
                    : "—"}
                </Badge>
                {!activeSub?.cancel_at_period_end ? (
                  <form
                    action={async () => {
                      "use server";
                      await cancelPlusAction();
                    }}
                  >
                    <Button type="submit" variant="outline" size="sm">
                      Cancel at period end
                    </Button>
                  </form>
                ) : null}
                <Button variant="outline" size="sm" render={<Link href="/dashboard/analytics" />}>
                  Open analytics
                </Button>
              </div>
            ) : (
              <form
                action={async () => {
                  "use server";
                  await subscribePlusAction();
                }}
              >
                <Button type="submit" disabled={!plusPricing.is_enabled}>
                  Subscribe to Plus
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Specialist profile</CardTitle>
        </CardHeader>
        <CardContent>
          <SpecialistProfileForm
            profile={profile}
            skills={skills ?? []}
            selectedSkillIds={selectedSkillIds}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Portfolio</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <PortfolioAddForm />
          <div className="space-y-2">
            {(portfolio ?? []).map((item) => (
              <div
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 px-3 py-2"
              >
                <div>
                  <p className="font-medium">{item.title}</p>
                  {item.description ? (
                    <p className="text-xs text-slate-500">{item.description}</p>
                  ) : null}
                </div>
                <form
                  action={async () => {
                    "use server";
                    await deletePortfolioItemAction(item.id);
                  }}
                >
                  <Button type="submit" size="sm" variant="ghost">
                    Remove
                  </Button>
                </form>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
