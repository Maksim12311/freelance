import Link from "next/link";
import {
  ArrowRight,
  Briefcase,
  FilePlus2,
  MessageSquare,
  Search,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlatformNotice } from "@/components/shared/platform-notice";
import { requireProfile, isVerificationActive } from "@/lib/auth";
import { DEMO_REQUESTS, DEMO_STUDENTS, isDemoMode } from "@/lib/demo";
import { createClient } from "@/lib/supabase/server";
import { formatBudget, formatRelativeDate } from "@/lib/utils";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const profile = await requireProfile("/dashboard");
  const verified = isVerificationActive(profile) || profile.is_admin;
  const mode = profile.active_mode ?? "customer";
  const demo = isDemoMode();

  let myRequests: Array<{
    id: string;
    title: string;
    status: string;
    created_at: string;
    application_count: number;
  }> = [];
  let myApplications: Array<{
    id: string;
    status: string;
    title: string;
  }> = [];
  let notifications: Array<{ id: string; title: string; body: string }> = [];
  let openNearby = DEMO_REQUESTS.filter((r) => r.owner_id !== profile.id).slice(0, 3);

  if (demo) {
    myRequests = DEMO_REQUESTS.filter((r) => r.owner_id === profile.id).map((r) => ({
      id: r.id,
      title: r.title,
      status: r.status,
      created_at: r.created_at,
      application_count: r.application_count,
    }));
    myApplications = [
      {
        id: "demo-app-1",
        status: "sent",
        title: DEMO_REQUESTS[0]?.title ?? "Open request",
      },
    ];
    notifications = [
      {
        id: "n1",
        title: "Welcome to the local preview",
        body: "Explore requests, switch to Specialist, and try the matching flow — no database needed.",
      },
      {
        id: "n2",
        title: "Suggested specialists are ready",
        body: "Open one of your requests to invite students that match category and location.",
      },
    ];
  } else {
    const supabase = await createClient();
    const [
      { data: requestRows },
      { data: applicationRows },
      { data: notificationRows },
      { data: nearbyRows },
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
        .select("id, title, body")
        .eq("profile_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(6),
      supabase
        .from("requests")
        .select(
          "id, title, description, suggested_budget_eur, location, work_mode, status, created_at, category:categories(name, slug), owner:profiles!requests_owner_id_fkey(display_name, verification_status)",
        )
        .eq("is_hidden", false)
        .eq("status", "open")
        .neq("owner_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(3),
    ]);

    myRequests = requestRows ?? [];
    myApplications = (applicationRows ?? []).map((application) => {
      const request = Array.isArray(application.request)
        ? application.request[0]
        : application.request;
      return {
        id: application.id,
        status: application.status,
        title: request?.title ?? "Request",
      };
    });
    notifications = notificationRows ?? [];
    if (nearbyRows?.length) {
      openNearby = nearbyRows.map((row) => {
        const category = Array.isArray(row.category) ? row.category[0] : row.category;
        const owner = Array.isArray(row.owner) ? row.owner[0] : row.owner;
        return {
          id: row.id,
          owner_id: "",
          category_id: "",
          title: row.title,
          description: row.description,
          suggested_budget_eur: row.suggested_budget_eur,
          location: row.location,
          work_mode: row.work_mode,
          preferred_date: null,
          status: row.status,
          preferred_applicant_id: null,
          application_count: 0,
          is_hidden: false,
          closed_at: null,
          created_at: row.created_at,
          updated_at: row.created_at,
          category: category ?? null,
          owner: owner ?? null,
        };
      });
    }
  }

  const openCount = myRequests.filter((r) => r.status === "open").length;
  const specialists = DEMO_STUDENTS.filter((s) => s.id !== profile.id).slice(0, 2);

  const actions = [
    {
      href: "/requests/new",
      title: "Post a request",
      text: "Ask for tutoring, design, moving help, and more.",
      icon: FilePlus2,
      tone: "rose",
    },
    {
      href: "/requests",
      title: "Browse requests",
      text: "Find open work that matches your skills.",
      icon: Search,
      tone: "soft",
    },
    {
      href: "/dashboard/specialist",
      title: "Specialist hub",
      text: "Profile, boosts, Plus, and recommended jobs.",
      icon: Briefcase,
      tone: "soft",
    },
    {
      href: "/messages",
      title: "Messages",
      text: "Continue unlocked conversations.",
      icon: MessageSquare,
      tone: "soft",
    },
  ] as const;

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-[#f0d5db] bg-white/85 p-6 shadow-[0_30px_60px_-40px_rgba(225,29,72,0.45)] sm:p-8">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full bg-[#ffe8ec] blur-2xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-20 left-10 h-40 w-40 rounded-full bg-[#fb7185]/20 blur-2xl"
        />
        <div className="relative flex flex-wrap items-start justify-between gap-5">
          <div className="max-w-xl">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge className="border-transparent bg-[#fff0f2] text-[#be123c]">
                {verified ? "Verified student" : "Verification needed"}
              </Badge>
              {demo ? (
                <Badge variant="outline" className="border-[#f0d5db] text-[#6f5f64]">
                  Local preview
                </Badge>
              ) : null}
            </div>
            <h1 className="font-heading text-3xl font-semibold tracking-tight text-[#2a2124] sm:text-4xl">
              Welcome back, {profile.first_name}
            </h1>
            <p className="mt-2 text-[15px] leading-relaxed text-[#6f5f64]">
              {mode === "specialist"
                ? "Specialist mode is on — apply to requests, manage your offer, and track visibility."
                : "Customer mode is on — post what you need and invite matching specialists."}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button
                className="bg-[#e11d48] hover:bg-[#be123c]"
                render={<Link href={mode === "specialist" ? "/requests" : "/requests/new"} />}
              >
                {mode === "specialist" ? "Find requests" : "Post a request"}
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" render={<Link href="/students" />}>
                Find students
              </Button>
            </div>
          </div>
          <p className="max-w-[15rem] text-right text-xs leading-relaxed text-[#6f5f64]">
            Use Customer / Specialist in the top bar — the left menu changes with your role.
          </p>
        </div>
      </section>

      {!verified ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm text-amber-950">
            Verify your student status to publish, apply, and message.
          </p>
          <Button size="sm" render={<Link href="/verify-student" />}>
            Verify now
          </Button>
        </div>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              href={action.href}
              className="group rounded-3xl border border-[#f0d5db] bg-white/90 p-5 shadow-[0_18px_40px_-34px_rgba(225,29,72,0.4)] transition duration-300 hover:-translate-y-1 hover:border-[#fb7185]/50 hover:shadow-[0_24px_50px_-30px_rgba(225,29,72,0.55)]"
            >
              <div
                className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-2xl ${
                  action.tone === "rose" ? "bg-[#e11d48] text-white" : "bg-[#fff0f2] text-[#e11d48]"
                }`}
              >
                <Icon className="h-4 w-4" />
              </div>
              <p className="font-heading text-base font-semibold text-[#2a2124]">{action.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-[#6f5f64]">{action.text}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[#be123c] opacity-80 transition group-hover:opacity-100">
                Open <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </Link>
          );
        })}
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Open requests", value: openCount },
          { label: "Applications", value: myApplications.length },
          { label: "Mode", value: mode === "specialist" ? "Specialist" : "Customer" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-3xl border border-[#f0d5db] bg-[#fff8f9] px-5 py-4"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9f1239]/70">
              {stat.label}
            </p>
            <p className="mt-2 font-heading text-2xl font-semibold text-[#2a2124]">{stat.value}</p>
          </div>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="space-y-4 rounded-[1.75rem] border border-[#f0d5db] bg-white/90 p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-heading text-xl font-semibold text-[#2a2124]">Your requests</h2>
              <p className="mt-1 text-sm text-[#6f5f64]">Published asks from this account.</p>
            </div>
            <Button size="sm" variant="outline" render={<Link href="/requests/new" />}>
              New
            </Button>
          </div>
          {myRequests.length ? (
            <div className="space-y-2">
              {myRequests.map((request) => (
                <Link
                  key={request.id}
                  href={`/requests/${request.id}`}
                  className="block rounded-2xl border border-[#f7dde2] bg-[#fffafb] px-4 py-3 transition hover:border-[#fb7185]/45 hover:bg-white"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-medium text-[#2a2124]">{request.title}</p>
                    <Badge
                      variant="secondary"
                      className="shrink-0 border-transparent bg-[#ffe8ec] text-[#9f1239]"
                    >
                      {request.status.replace("_", " ")}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-[#6f5f64]">
                    {request.application_count} applications · {formatRelativeDate(request.created_at)}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-[#f0d5db] bg-[#fff8f9] px-4 py-8 text-center">
              <Sparkles className="mx-auto h-5 w-5 text-[#e11d48]" />
              <p className="mt-3 font-medium text-[#2a2124]">Nothing posted yet</p>
              <p className="mt-1 text-sm text-[#6f5f64]">
                Create a request and we’ll suggest matching specialists right away.
              </p>
              <Button className="mt-4 bg-[#e11d48] hover:bg-[#be123c]" render={<Link href="/requests/new" />}>
                Post your first request
              </Button>
            </div>
          )}
        </section>

        <section className="space-y-4 rounded-[1.75rem] border border-[#f0d5db] bg-white/90 p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-heading text-xl font-semibold text-[#2a2124]">Open nearby</h2>
              <p className="mt-1 text-sm text-[#6f5f64]">Requests you can apply to.</p>
            </div>
            <Button size="sm" variant="outline" render={<Link href="/requests" />}>
              All
            </Button>
          </div>
          <div className="space-y-2">
            {openNearby.map((request) => (
              <Link
                key={request.id}
                href={`/requests/${request.id}`}
                className="block rounded-2xl border border-[#f7dde2] px-4 py-3 transition hover:border-[#fb7185]/45 hover:bg-[#fff8f9]"
              >
                <p className="font-medium text-[#2a2124]">{request.title}</p>
                <p className="mt-1 text-xs text-[#6f5f64]">
                  {request.category?.name ?? "Category"} · {request.location || "Vienna"} ·{" "}
                  {formatBudget(request.suggested_budget_eur)}
                </p>
              </Link>
            ))}
          </div>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-4 rounded-[1.75rem] border border-[#f0d5db] bg-white/90 p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-heading text-xl font-semibold text-[#2a2124]">Applications</h2>
            <Button size="sm" variant="outline" render={<Link href="/dashboard/applications" />}>
              View
            </Button>
          </div>
          {myApplications.length ? (
            <div className="space-y-2">
              {myApplications.map((application) => (
                <div
                  key={application.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-[#f7dde2] px-4 py-3"
                >
                  <p className="font-medium text-[#2a2124]">{application.title}</p>
                  <Badge variant="outline" className="border-[#f0d5db] capitalize text-[#6f5f64]">
                    {application.status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#6f5f64]">
              No applications yet.{" "}
              <Link href="/requests" className="font-medium text-[#be123c] underline-offset-2 hover:underline">
                Browse open requests
              </Link>
              .
            </p>
          )}
        </section>

        <section className="space-y-4 rounded-[1.75rem] border border-[#f0d5db] bg-white/90 p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-heading text-xl font-semibold text-[#2a2124]">Updates</h2>
            {mode === "specialist" ? (
              <Button size="sm" variant="outline" render={<Link href="/dashboard/specialist" />}>
                Specialist hub
              </Button>
            ) : null}
          </div>
          {notifications.length ? (
            <div className="space-y-2">
              {notifications.map((n) => (
                <div key={n.id} className="rounded-2xl border border-[#f7dde2] bg-[#fffafb] px-4 py-3">
                  <p className="text-sm font-medium text-[#2a2124]">{n.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-[#6f5f64]">{n.body}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#6f5f64]">You’re all caught up.</p>
          )}

          {specialists.length ? (
            <div className="border-t border-[#f7dde2] pt-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9f1239]/70">
                Specialists nearby
              </p>
              <div className="mt-3 space-y-2">
                {specialists.map((student) => (
                  <Link
                    key={student.id}
                    href={`/students/${student.id}`}
                    className="flex items-center justify-between rounded-2xl px-1 py-1.5 transition hover:bg-[#fff5f6]"
                  >
                    <div>
                      <p className="text-sm font-medium text-[#2a2124]">{student.display_name}</p>
                      <p className="text-xs text-[#6f5f64]">
                        {student.specialist_headline || student.university?.short_name || "Student"}
                      </p>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-[#e11d48]" />
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      </div>

      <PlatformNotice compact />
    </div>
  );
}
