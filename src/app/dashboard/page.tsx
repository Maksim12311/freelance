import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, FilePlus2, MessageSquare, Sparkles, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlatformNotice } from "@/components/shared/platform-notice";
import { requireProfile, isVerificationActive } from "@/lib/auth";
import { getFeaturedStudents } from "@/lib/data";
import { DEMO_REQUESTS, isDemoMode } from "@/lib/demo";
import { createClient } from "@/lib/supabase/server";
import { formatRelativeDate } from "@/lib/utils";

export const metadata = { title: "Home" };

/** Customer home — specialists are redirected to their own home. */
export default async function CustomerHomePage() {
  const profile = await requireProfile("/dashboard");
  const mode = profile.active_mode ?? "customer";

  if (mode === "specialist") {
    redirect("/dashboard/specialist");
  }

  const verified = isVerificationActive(profile) || profile.is_admin;
  const demo = isDemoMode();

  let myRequests: Array<{
    id: string;
    title: string;
    status: string;
    created_at: string;
    application_count: number;
  }> = [];
  let notifications: Array<{ id: string; title: string; body: string }> = [];

  if (demo) {
    myRequests = DEMO_REQUESTS.filter((r) => r.owner_id === profile.id).map((r) => ({
      id: r.id,
      title: r.title,
      status: r.status,
      created_at: r.created_at,
      application_count: r.application_count,
    }));
    notifications = [
      {
        id: "n1",
        title: "Invite specialists after posting",
        body: "Open a request → Suggested specialists → Invite free. They still pay to apply.",
      },
    ];
  } else {
    const supabase = await createClient();
    const [{ data: requestRows }, { data: notificationRows }] = await Promise.all([
      supabase
        .from("requests")
        .select("id, title, status, created_at, application_count")
        .eq("owner_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(6),
      supabase
        .from("notifications")
        .select("id, title, body")
        .eq("profile_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);
    myRequests = requestRows ?? [];
    notifications = notificationRows ?? [];
  }

  const openCount = myRequests.filter((r) => r.status === "open").length;
  const featured = await getFeaturedStudents(4);
  const specialists = featured
    .filter((s) => s.id !== profile.id)
    .slice(0, 3)
    .map((s) => ({
      id: s.id,
      display_name: s.display_name,
      specialist_headline:
        "specialist_headline" in s
          ? ((s as { specialist_headline?: string | null }).specialist_headline ?? null)
          : null,
      university: Array.isArray(s.university) ? s.university[0] : s.university,
    }));

  const actions = [
    {
      href: "/requests/new",
      title: "Post a request",
      text: "Describe what you need — tutoring, design, moving, tech.",
      icon: FilePlus2,
      primary: true,
    },
    {
      href: "/students",
      title: "Find specialists",
      text: "Browse verified students and invite them to apply.",
      icon: Users,
      primary: false,
    },
    {
      href: "/messages",
      title: "Messages",
      text: "Chat after a specialist unlocks an application.",
      icon: MessageSquare,
      primary: false,
    },
  ] as const;

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-[#f0d5db] bg-white/90 p-6 shadow-[0_30px_60px_-40px_rgba(225,29,72,0.4)] sm:p-8">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-8 -top-12 h-48 w-48 rounded-full bg-[#ffe8ec] blur-2xl"
        />
        <div className="relative max-w-2xl">
          <div className="mb-3 flex flex-wrap gap-2">
            <Badge className="border-transparent bg-[#fff0f2] text-[#be123c]">Customer</Badge>
            {verified ? (
              <Badge variant="outline" className="border-[#f0d5db] text-[#6f5f64]">
                Verified
              </Badge>
            ) : null}
          </div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-[#2a2124] sm:text-4xl">
            Hi {profile.first_name} — what do you need help with?
          </h1>
          <p className="mt-2 text-[15px] leading-relaxed text-[#6f5f64]">
            Publish a request for free, get matched specialists, and invite the ones you like.
            Messaging unlocks after they apply.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button className="bg-[#e11d48] hover:bg-[#be123c]" render={<Link href="/requests/new" />}>
              Post a request
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" render={<Link href="/dashboard/requests" />}>
              My requests
            </Button>
          </div>
        </div>
      </section>

      {!verified ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm text-amber-950">Verify your student status to publish and message.</p>
          <Button size="sm" render={<Link href="/verify-student" />}>
            Verify now
          </Button>
        </div>
      ) : null}

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

      <section className="grid gap-3 sm:grid-cols-2">
        {[
          { label: "Open requests", value: openCount },
          { label: "Total published", value: myRequests.length },
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
              <h2 className="font-heading text-xl font-semibold text-[#2a2124]">Your requests</h2>
              <p className="mt-1 text-sm text-[#6f5f64]">Track applications and invite specialists.</p>
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
                  href={`/requests/${request.id}/suggestions`}
                  className="block rounded-2xl border border-[#f7dde2] bg-[#fffafb] px-4 py-3 transition hover:border-[#fb7185]/45 hover:bg-white"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-medium text-[#2a2124]">{request.title}</p>
                    <Badge className="shrink-0 border-transparent bg-[#ffe8ec] text-[#9f1239]">
                      {request.status.replace("_", " ")}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-[#6f5f64]">
                    {request.application_count} applications · {formatRelativeDate(request.created_at)} ·
                    View suggestions
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-[#f0d5db] bg-[#fff8f9] px-4 py-8 text-center">
              <Sparkles className="mx-auto h-5 w-5 text-[#e11d48]" />
              <p className="mt-3 font-medium text-[#2a2124]">No requests yet</p>
              <p className="mt-1 text-sm text-[#6f5f64]">
                Post once and we’ll suggest matching specialists right away.
              </p>
              <Button
                className="mt-4 bg-[#e11d48] hover:bg-[#be123c]"
                render={<Link href="/requests/new" />}
              >
                Post your first request
              </Button>
            </div>
          )}
        </section>

        <div className="space-y-6">
          <section className="space-y-4 rounded-[1.75rem] border border-[#f0d5db] bg-white/90 p-5 sm:p-6">
            <h2 className="font-heading text-xl font-semibold text-[#2a2124]">Specialists to invite</h2>
            <div className="space-y-2">
              {specialists.map((student) => (
                <Link
                  key={student.id}
                  href={`/students/${student.id}`}
                  className="flex items-center justify-between rounded-2xl border border-[#f7dde2] px-3 py-3 transition hover:bg-[#fff8f9]"
                >
                  <div>
                    <p className="text-sm font-medium text-[#2a2124]">{student.display_name}</p>
                    <p className="text-xs text-[#6f5f64]">
                      {student.specialist_headline ||
                        student.university?.short_name ||
                        student.university?.name ||
                        "Specialist"}
                    </p>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-[#e11d48]" />
                </Link>
              ))}
            </div>
            <Button size="sm" variant="outline" className="w-full" render={<Link href="/students" />}>
              Browse all specialists
            </Button>
          </section>

          <section className="space-y-3 rounded-[1.75rem] border border-[#f0d5db] bg-white/90 p-5 sm:p-6">
            <h2 className="font-heading text-xl font-semibold text-[#2a2124]">Updates</h2>
            {notifications.length ? (
              notifications.map((n) => (
                <div key={n.id} className="rounded-2xl border border-[#f7dde2] bg-[#fffafb] px-3 py-3">
                  <p className="text-sm font-medium text-[#2a2124]">{n.title}</p>
                  <p className="mt-1 text-xs text-[#6f5f64]">{n.body}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-[#6f5f64]">You’re all caught up.</p>
            )}
          </section>
        </div>
      </div>

      <PlatformNotice compact />
    </div>
  );
}
