import Link from "next/link";
import {
  ArrowRight,
  Camera,
  Film,
  Palette,
  BookOpen,
  Laptop,
  Truck,
  Languages,
  HandHelping,
  ShieldCheck,
  Search,
  Users,
  MessageCircle,
} from "lucide-react";
import { PublicShell } from "@/components/layout/public-shell";
import { RequestCard } from "@/components/shared/request-card";
import { StudentCard } from "@/components/shared/student-card";
import { PlatformNotice } from "@/components/shared/platform-notice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getCategories, getFeaturedStudents, getRecentRequests, hasSupabaseEnv } from "@/lib/data";

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  photography: Camera,
  "video-editing": Film,
  "graphic-design": Palette,
  tutoring: BookOpen,
  technology: Laptop,
  "moving-help": Truck,
  "language-support": Languages,
  "everyday-help": HandHelping,
};

const fallbackCategories = [
  { name: "Photography", slug: "photography" },
  { name: "Video Editing", slug: "video-editing" },
  { name: "Graphic Design", slug: "graphic-design" },
  { name: "Tutoring", slug: "tutoring" },
  { name: "Technology", slug: "technology" },
  { name: "Moving Help", slug: "moving-help" },
  { name: "Language Support", slug: "language-support" },
  { name: "Everyday Help", slug: "everyday-help" },
];

export default async function HomePage() {
  const configured = hasSupabaseEnv();
  const [categories, recentRequests, featuredStudents] = configured
    ? await Promise.all([getCategories(), getRecentRequests(6), getFeaturedStudents(4)])
    : [[], [], []];

  const popular = categories.length ? categories : fallbackCategories;

  return (
    <PublicShell>
      <section className="relative overflow-hidden border-b border-slate-200 bg-[radial-gradient(circle_at_top_right,#dbeafe,transparent_45%),linear-gradient(180deg,#ffffff,|#f8fafc)]">
        <div className="pointer-events-none absolute -left-24 top-20 h-72 w-72 rounded-full bg-blue-100/60 blur-3xl" />
        <div className="pointer-events-none absolute -right-16 bottom-0 h-64 w-64 rounded-full bg-sky-100/70 blur-3xl" />
        <div className="relative mx-auto grid w-full max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:py-24">
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-700">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#2563EB]">
              StudentPro · Vienna
            </p>
            <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              Your Skills. Your Community. Your Opportunities.
            </h1>
            <p className="max-w-lg text-lg leading-relaxed text-slate-600">
              Students Helping Students. Discover requests, offer your skills, and connect
              directly — StudentPro does not process service payments.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" className="bg-[#2563EB] hover:bg-blue-700" render={<Link href="/requests" />}>Find Requests
                  <ArrowRight className="h-4 w-4" /></Button>
              <Button size="lg" variant="outline" render={<Link href="/requests/new" />}>Post a Request</Button>
            </div>
            <form action="/requests" className="relative max-w-xl">
              <Search className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                name="q"
                placeholder="What do you need help with?"
                className="h-12 rounded-2xl border-slate-200 bg-white pl-11 shadow-sm"
              />
            </form>
          </div>
          <div className="relative hidden items-center justify-center lg:flex">
            <div className="w-full rounded-[2rem] border border-white/80 bg-white/80 p-6 shadow-xl shadow-blue-100/50 backdrop-blur">
              <div className="space-y-4">
                <div className="rounded-2xl bg-slate-900 p-5 text-white">
                  <p className="text-sm text-slate-300">Marketplace notice</p>
                  <p className="mt-2 text-lg font-medium leading-snug">
                    Connect with verified students. Agree on details independently.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Student-only", icon: Users },
                    { label: "Direct messaging", icon: MessageCircle },
                    { label: "No service payments", icon: ShieldCheck },
                    { label: "Vienna-focused", icon: Search },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <item.icon className="mb-3 h-4 w-4 text-[#2563EB]" />
                      <p className="text-sm font-medium text-slate-800">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Popular categories</h2>
            <p className="mt-2 text-sm text-slate-600">Browse common ways students help each other.</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {popular.map((category) => {
            const Icon = categoryIcons[category.slug] ?? HandHelping;
            return (
              <Link
                key={category.slug}
                href={`/requests?category=${category.slug}`}
                className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
              >
                <Icon className="mb-3 h-5 w-5 text-[#2563EB] transition group-hover:scale-110" />
                <p className="text-sm font-medium text-slate-900">{category.name}</p>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="bg-slate-50 py-14">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <h2 className="text-2xl font-semibold tracking-tight">How StudentPro Works</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            A simple path from student verification to independent collaboration.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-4">
            {[
              "Verify your student status.",
              "Discover requests or offer your skills.",
              "Connect directly with another student.",
              "Agree on the details independently.",
            ].map((step, index) => (
              <div
                key={step}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="mb-4 flex h-8 w-8 items-center justify-center rounded-full bg-[#2563EB] text-sm font-semibold text-white">
                  {index + 1}
                </div>
                <p className="text-sm font-medium leading-relaxed text-slate-800">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Recent requests</h2>
            <p className="mt-2 text-sm text-slate-600">
              {configured
                ? "Open requests from verified students."
                : "Connect Supabase to load live requests. Demo cards are not shown as real activity."}
            </p>
          </div>
          <Button variant="outline" render={<Link href="/requests" />}>View all</Button>
        </div>
        {recentRequests.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recentRequests.map((request) => (
              <RequestCard
                key={request.id}
                request={{
                  ...request,
                  category: Array.isArray(request.category)
                    ? request.category[0]
                    : request.category,
                  owner: Array.isArray(request.owner) ? request.owner[0] : request.owner,
                }}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center text-sm text-slate-600">
            No open requests yet. Be the first to{" "}
            <Link href="/requests/new" className="font-medium text-[#2563EB]">
              post a request
            </Link>
            .
          </div>
        )}
      </section>

      <section className="bg-slate-50 py-14">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold tracking-tight">Featured verified students</h2>
            <p className="mt-2 text-sm text-slate-600">
              Profiles appear only after student verification. Ratings are peer feedback, not
              professional certification.
            </p>
          </div>
          {featuredStudents.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {featuredStudents.map((student) => (
                <StudentCard
                  key={student.id}
                  student={{
                    ...student,
                    university: Array.isArray(student.university)
                      ? student.university[0]
                      : student.university,
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-600">
              Verified student profiles will appear here once accounts are connected to Supabase.
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl space-y-6 px-4 py-14 sm:px-6">
        <h2 className="text-2xl font-semibold tracking-tight">Trust & safety</h2>
        <PlatformNotice />
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              title: "Student verification",
              body: "University email allowlists or enrollment documents reviewed before publishing and messaging.",
            },
            {
              title: "Report & moderate",
              body: "Report requests, profiles, messages, and reviews. Challenge moderation decisions through appeals.",
            },
            {
              title: "Independent arrangements",
              body: "Students agree on timing, conditions, and any payment directly. StudentPro never holds service funds.",
            },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border border-slate-200 p-5">
              <h3 className="font-semibold text-slate-900">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.body}</p>
            </div>
          ))}
        </div>
      </section>
    </PublicShell>
  );
}
