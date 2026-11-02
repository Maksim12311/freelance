import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  BarChart3,
  Briefcase,
  Search,
  Send,
  Sparkles,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MatchReasons } from "@/components/shared/match-reasons";
import { PlatformNotice } from "@/components/shared/platform-notice";
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
import { DEMO_REQUESTS, DEMO_PROFILE_ID, isDemoMode } from "@/lib/demo";
import type { MatchReason } from "@/lib/matching";
import { createClient } from "@/lib/supabase/server";
import { formatBudget, formatRelativeDate } from "@/lib/utils";
import { PortfolioAddForm, SpecialistProfileForm } from "@/components/forms/specialist-forms";

export const metadata = { title: "Home" };

/** Specialist home — customers are redirected to customer home. */
export default async function SpecialistHomePage() {
  const profile = await requireVerifiedStudent("/dashboard/specialist");
  const supabase = await createClient();

  if (profile.active_mode !== "specialist") {
    redirect("/dashboard");
  }

  const demo = isDemoMode();

  let recommended = await getRecommendedRequestsForSpecialist(profile.id, { limit: 8 });

  if (demo && !recommended.length) {
    recommended = DEMO_REQUESTS.filter((r) => r.owner_id !== DEMO_PROFILE_ID).map((r, index) => ({
      item: {
        id: r.id,
        owner_id: r.owner_id,
        category_id: r.category_id,
        title: r.title,
        description: r.description,
        suggested_budget_eur: r.suggested_budget_eur,
        location: r.location,
        work_mode: r.work_mode,
        preferred_date: r.preferred_date,
        category_name: r.category?.name ?? null,
      },
      score: 72 - index * 6,
      reasons: [
        { code: "category", label: "Matches your categories", weight: 40 },
        { code: "location", label: "Vienna · compatible", weight: 15 },
        { code: "budget", label: "Budget range compatible", weight: 10 },
      ] as MatchReason[],
      isSponsored: false,
      placement: "organic" as const,
    }));
  }

  const [
    boostActive,
    plusActive,
    credits,
    boostPricing,
    plusPricing,
    { data: portfolio },
    { data: invitationRows },
    { data: skills },
    { data: selectedSkills },
    { data: activeBoost },
    { data: activeSub },
  ] = await Promise.all([
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
      .limit(8),
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

  type InvitationRow = {
    id: string;
    status: string;
    message: string | null;
    created_at: string;
    request: { id: string; title: string; status?: string; suggested_budget_eur?: number | null } | null;
  };

  let invitations: InvitationRow[] = (invitationRows ?? []).map((inv) => {
    const request = Array.isArray(inv.request) ? inv.request[0] : inv.request;
    return {
      id: inv.id,
      status: inv.status,
      message: inv.message,
      created_at: inv.created_at,
      request: request
        ? {
            id: request.id,
            title: request.title,
            status: request.status,
            suggested_budget_eur: request.suggested_budget_eur,
          }
        : null,
    };
  });

  if (demo && !invitations.length) {
    const sample = DEMO_REQUESTS.find((r) => r.owner_id !== DEMO_PROFILE_ID);
    if (sample) {
      invitations = [
        {
          id: "demo-invite-1",
          status: "sent",
          message: "Looks like a good fit for your skills — apply if you’re free this week.",
          created_at: sample.created_at,
          request: {
            id: sample.id,
            title: sample.title,
            status: sample.status,
            suggested_budget_eur: sample.suggested_budget_eur,
          },
        },
      ];
    }
  }

  const selectedSkillIds = (selectedSkills ?? []).map((s) => s.skill_id);
  const skillOptions =
    skills && skills.length
      ? skills
      : demo
        ? [
            { id: "skill-tutoring", name: "Tutoring" },
            { id: "skill-design", name: "Design" },
            { id: "skill-tech", name: "Tech Help" },
            { id: "skill-moving", name: "Moving" },
          ]
        : [];
  const profileReady = Boolean(
    profile.specialist_headline || profile.specialist_bio || selectedSkillIds.length,
  );

  const actions = [
    {
      href: "/requests",
      title: "Browse jobs",
      text: "Open requests you can apply to — invitation not required.",
      icon: Search,
      primary: true,
    },
    {
      href: "/dashboard/applications",
      title: "My applications",
      text: "Track sent applications and unlock status.",
      icon: Send,
      primary: false,
    },
    {
      href: "/dashboard/analytics",
      title: "Analytics",
      text: plusActive ? "Views, invites, conversion." : "Included with StudentPro Plus.",
      icon: BarChart3,
      primary: false,
    },
  ] as const;

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-[#f0d5db] bg-white/90 p-6 shadow-[0_30px_60px_-40px_rgba(225,29,72,0.4)] sm:p-8">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-14 h-52 w-52 rounded-full bg-[#ffe8ec] blur-2xl"
        />
        <div className="relative max-w-2xl">
          <div className="mb-3 flex flex-wrap gap-2">
            <Badge className="border-transparent bg-[#fff0f2] text-[#be123c]">Specialist</Badge>
            {boostActive ? <Badge variant="secondary">Boost on</Badge> : null}
            {plusActive ? <Badge variant="outline">Plus</Badge> : null}
          </div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-[#2a2124] sm:text-4xl">
            Ready to take work, {profile.first_name}?
          </h1>
          <p className="mt-2 text-[15px] leading-relaxed text-[#6f5f64]">
            Browse open requests, apply with the fee (or a credit), and message customers after
            unlock. Invitations are optional discovery — not a gate.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button className="bg-[#e11d48] hover:bg-[#be123c]" render={<Link href="/requests" />}>
              Browse jobs
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" render={<Link href="#profile" />}>
              Edit specialist profile
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              href={action.href}
              className="group rounded-3xl border border-[#f0d5db] bg-white/90 p-5 transition duration-300 hover:-translate-y-1 hover:border-[#fb7185]/45"
            >
              <div
                className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-2xl ${
                  action.primary ? "bg-[#e11d48] text-white" : "bg-[#fff0f2] text-[#e11d48]"
                }`}
              >
                <Icon className="h-4 w-4" />
              </div>
              <p className="font-heading text-base font-semibold text-[#2a2124]">{action.title}</p>
              <p className="mt-1 text-sm text-[#6f5f64]">{action.text}</p>
            </Link>
          );
        })}
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        {[
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
          <div key={stat.label} className="rounded-3xl border border-[#f0d5db] bg-[#fff8f9] px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9f1239]/70">
              {stat.label}
            </p>
            <p className="mt-2 font-heading text-2xl font-semibold text-[#2a2124]">{stat.value}</p>
          </div>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="space-y-4 rounded-[1.75rem] border border-[#f0d5db] bg-white/90 p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-heading text-xl font-semibold text-[#2a2124]">
                Recommended for you
              </h2>
              <p className="mt-1 text-sm text-[#6f5f64]">
                Matched by category, location, budget, and availability.
              </p>
            </div>
            <Button size="sm" variant="outline" render={<Link href="/requests" />}>
              All jobs
            </Button>
          </div>
          {recommended.length ? (
            <div className="space-y-2">
              {recommended.map((row) => (
                <Link
                  key={row.item.id}
                  href={`/requests/${row.item.id}`}
                  className="block rounded-2xl border border-[#f7dde2] bg-[#fffafb] px-4 py-3 transition hover:border-[#fb7185]/45 hover:bg-white"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-medium text-[#2a2124]">{row.item.title}</p>
                    <Badge variant="outline" className="border-[#f0d5db]">
                      {formatBudget(row.item.suggested_budget_eur)}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-[#6f5f64]">
                    {row.item.category_name ?? "Category"} · {row.item.location || "Vienna"} ·{" "}
                    {row.item.work_mode.replace("_", " ")}
                  </p>
                  <MatchReasons reasons={row.reasons} />
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-[#f0d5db] bg-[#fff8f9] px-4 py-8 text-center">
              <Briefcase className="mx-auto h-5 w-5 text-[#e11d48]" />
              <p className="mt-3 font-medium text-[#2a2124]">No matches yet</p>
              <p className="mt-1 text-sm text-[#6f5f64]">
                Add skills and a headline below, then browse all open requests.
              </p>
              <Button className="mt-4" variant="outline" render={<Link href="/requests" />}>
                Browse jobs
              </Button>
            </div>
          )}
        </section>

        <section className="space-y-4 rounded-[1.75rem] border border-[#f0d5db] bg-white/90 p-5 sm:p-6">
          <h2 className="font-heading text-xl font-semibold text-[#2a2124]">Invitations</h2>
          <p className="text-sm text-[#6f5f64]">
            Customers can invite you for free. Applying still uses the application fee.
          </p>
          {invitations.length ? (
            <div className="space-y-2">
              {invitations.map((inv) => (
                <div key={inv.id} className="rounded-2xl border border-[#f7dde2] px-3 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-[#2a2124]">{inv.request?.title ?? "Request"}</p>
                    <Badge variant="secondary">{inv.status}</Badge>
                  </div>
                  {inv.message ? (
                    <p className="mt-1 text-sm text-[#6f5f64]">{inv.message}</p>
                  ) : null}
                  <p className="mt-1 text-xs text-[#6f5f64]">
                    {formatRelativeDate(inv.created_at)}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {inv.request?.id ? (
                      <Button size="sm" render={<Link href={`/requests/${inv.request.id}`} />}>
                        Open
                      </Button>
                    ) : null}
                    {!inv.id.startsWith("demo-") ? (
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
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#6f5f64]">No open invitations right now.</p>
          )}
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-3 rounded-[1.75rem] border border-[#f0d5db] bg-white/90 p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-[#e11d48]" />
            <h2 className="font-heading text-lg font-semibold text-[#2a2124]">Profile boost</h2>
          </div>
          <p className="text-sm text-[#6f5f64]">
            Higher placement in relevant recommendations for{" "}
            {Number(boostPricing.metadata.duration_days ?? 7)} days. Labeled Sponsored — never
            overrides basic relevance.
          </p>
          <p className="font-medium text-[#2a2124]">{formatEur(boostPricing.amount_eur)}</p>
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
        </section>

        <section className="space-y-3 rounded-[1.75rem] border border-[#f0d5db] bg-white/90 p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#e11d48]" />
            <h2 className="font-heading text-lg font-semibold text-[#2a2124]">StudentPro Plus</h2>
          </div>
          <p className="text-sm text-[#6f5f64]">
            Modest visibility + analytics. Applications stay charged separately. No job guarantee.
          </p>
          <p className="font-medium text-[#2a2124]">{formatEur(plusPricing.amount_eur)}/month</p>
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
        </section>
      </div>

      <section
        id="profile"
        className="space-y-6 rounded-[1.75rem] border border-[#f0d5db] bg-white/90 p-5 sm:p-6"
      >
        <div>
          <h2 className="font-heading text-xl font-semibold text-[#2a2124]">Specialist profile</h2>
          <p className="mt-1 text-sm text-[#6f5f64]">
            {profileReady
              ? "Keep skills and budget ranges up to date for better matches."
              : "Add a headline and skills so customers and matching can find you."}
          </p>
        </div>
        <SpecialistProfileForm
          profile={profile}
          skills={skillOptions}
          selectedSkillIds={
            selectedSkillIds.length
              ? selectedSkillIds
              : demo
                ? ["skill-tutoring", "skill-design"]
                : []
          }
        />

        <div className="border-t border-[#f7dde2] pt-6">
          <h3 className="font-heading text-lg font-semibold text-[#2a2124]">Portfolio</h3>
          <div className="mt-4 space-y-4">
            <PortfolioAddForm />
            <div className="space-y-2">
              {(portfolio ?? []).map((item) => (
                <div
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[#f7dde2] px-3 py-2"
                >
                  <div>
                    <p className="font-medium text-[#2a2124]">{item.title}</p>
                    {item.description ? (
                      <p className="text-xs text-[#6f5f64]">{item.description}</p>
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
          </div>
        </div>
      </section>

      <PlatformNotice compact />
    </div>
  );
}
