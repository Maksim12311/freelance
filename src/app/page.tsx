import Image from "next/image";
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
  Search,
  ShieldCheck,
  MessageCircle,
  BadgeCheck,
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
    <PublicShell tone="hero">
      <section className="relative isolate min-h-[min(92vh,880px)] overflow-hidden">
        <Image
          src="/hero.jpg"
          alt="Students collaborating outdoors near a European campus"
          fill
          priority
          className="animate-drift object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,6,23,0.78)_0%,rgba(2,6,23,0.52)_48%,rgba(2,6,23,0.28)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(37,99,235,0.28),transparent_42%)]" />

        <div className="relative mx-auto flex min-h-[min(92vh,880px)] w-full max-w-6xl flex-col justify-end px-4 pb-16 pt-28 sm:px-6 sm:pb-20 lg:justify-center lg:pb-24">
          <div className="max-w-2xl space-y-7 text-white">
            <p className="animate-rise font-heading text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              StudentPro
            </p>
            <h1
              className="animate-rise font-heading text-3xl font-medium leading-[1.08] text-balance text-white/95 sm:text-4xl lg:text-5xl"
              style={{ animationDelay: "90ms" }}
            >
              Your Skills. Your Community. Your Opportunities.
            </h1>
            <p
              className="animate-rise max-w-xl text-base leading-relaxed text-white/78 sm:text-lg"
              style={{ animationDelay: "160ms" }}
            >
              Students Helping Students across Vienna — connect directly, arrange details
              independently.
            </p>
            <div
              className="animate-rise flex flex-wrap gap-3 pt-1"
              style={{ animationDelay: "230ms" }}
            >
              <Button
                size="lg"
                className="h-11 rounded-2xl bg-white px-6 text-slate-950 hover:bg-blue-50"
                render={<Link href="/requests" />}
              >
                Find Requests
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-11 rounded-2xl border-white/35 bg-white/10 px-6 text-white backdrop-blur hover:bg-white/18 hover:text-white"
                render={<Link href="/requests/new" />}
              >
                Post a Request
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="relative border-b border-slate-200/80 bg-white/80 py-10 backdrop-blur">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <form
            action="/requests"
            className="flex flex-col gap-3 rounded-[1.6rem] border border-slate-200 bg-slate-50/90 p-3 shadow-[0_20px_50px_-36px_rgba(15,23,42,0.45)] sm:flex-row sm:items-center"
          >
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                name="q"
                placeholder="What do you need help with?"
                className="h-12 rounded-2xl border-transparent bg-white pl-11 shadow-none"
              />
            </div>
            <Button type="submit" className="h-12 rounded-2xl px-6">
              Search requests
            </Button>
          </form>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
        <div className="mb-8 max-w-2xl">
          <h2 className="font-heading text-3xl font-semibold tracking-tight">Popular categories</h2>
          <p className="mt-2 text-slate-600">
            Browse the ways Vienna students help each other every week.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {popular.map((category, index) => {
            const Icon = categoryIcons[category.slug] ?? HandHelping;
            return (
              <Link
                key={category.slug}
                href={`/requests?category=${category.slug}`}
                className="group rounded-[1.4rem] border border-slate-200/90 bg-white/90 p-5 transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:bg-blue-50/40"
                style={{ transitionDelay: `${index * 20}ms` }}
              >
                <span className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#2563EB]/10 text-[#2563EB] transition group-hover:scale-110">
                  <Icon className="h-5 w-5" />
                </span>
                <p className="font-heading text-base font-medium text-slate-900">{category.name}</p>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="surface-grid border-y border-slate-200/70 bg-[#f8fafc] py-16">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <div className="mb-10 max-w-2xl">
            <h2 className="font-heading text-3xl font-semibold tracking-tight">
              How StudentPro Works
            </h2>
            <p className="mt-2 text-slate-600">
              From verified student status to an independent collaboration — four clear steps.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-4">
            {[
              "Verify your student status.",
              "Discover requests or offer your skills.",
              "Connect directly with another student.",
              "Agree on the details independently.",
            ].map((step, index) => (
              <div key={step} className="relative pt-2">
                <div className="mb-5 font-heading text-5xl font-semibold tracking-tight text-[#2563EB]/15">
                  0{index + 1}
                </div>
                <p className="text-base font-medium leading-relaxed text-slate-800">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-heading text-3xl font-semibold tracking-tight">Recent requests</h2>
            <p className="mt-2 text-slate-600">
              {configured
                ? "Open requests from verified students."
                : "Connect Supabase to load live requests. Empty state is intentional — not demo users."}
            </p>
          </div>
          <Button variant="outline" className="rounded-2xl" render={<Link href="/requests" />}>
            View all
          </Button>
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
          <div className="rounded-[1.8rem] border border-dashed border-slate-300 bg-slate-50/80 px-6 py-16 text-center">
            <p className="font-heading text-xl font-medium text-slate-900">No open requests yet</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
              Be the first to publish what you need help with.
            </p>
            <Button className="mt-6 rounded-2xl" render={<Link href="/requests/new" />}>
              Post a Request
            </Button>
          </div>
        )}
      </section>

      <section className="bg-[linear-gradient(180deg,#eff6ff_0%,#f8fafc_55%,#ffffff_100%)] py-16">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <div className="mb-8 max-w-2xl">
            <h2 className="font-heading text-3xl font-semibold tracking-tight">
              Featured verified students
            </h2>
            <p className="mt-2 text-slate-600">
              Profiles appear only after verification. Ratings are peer feedback, not professional
              certification.
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
            <div className="rounded-[1.8rem] border border-slate-200/80 bg-white/70 px-6 py-14 text-center text-sm text-slate-600 backdrop-blur">
              Verified student profiles will appear here once Supabase is connected.
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl space-y-8 px-4 py-16 sm:px-6">
        <div className="max-w-2xl">
          <h2 className="font-heading text-3xl font-semibold tracking-tight">Trust & safety</h2>
          <p className="mt-2 text-slate-600">
            Built as a connecting platform — with clear limits and moderation tools.
          </p>
        </div>
        <PlatformNotice />
        <div className="grid gap-5 md:grid-cols-3">
          {[
            {
              title: "Student verification",
              body: "University email allowlists or enrollment documents reviewed before publishing and messaging.",
              icon: BadgeCheck,
            },
            {
              title: "Report & moderate",
              body: "Report requests, profiles, messages, and reviews. Challenge moderation decisions through appeals.",
              icon: ShieldCheck,
            },
            {
              title: "Independent arrangements",
              body: "Students agree on timing, conditions, and any payment directly. StudentPro never holds service funds.",
              icon: MessageCircle,
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-[1.5rem] border border-slate-200 bg-white p-6 transition hover:border-blue-200"
            >
              <item.icon className="mb-4 h-5 w-5 text-[#2563EB]" />
              <h3 className="font-heading text-lg font-semibold text-slate-900">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.body}</p>
            </div>
          ))}
        </div>
      </section>
    </PublicShell>
  );
}
