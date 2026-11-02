import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
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
      <section className="relative isolate min-h-[min(92vh,900px)] overflow-hidden">
        <Image
          src="/hero.jpg"
          alt="Bright student workspace with Vienna rooftops outside the window"
          fill
          priority
          className="animate-pan object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-[linear-gradient(105deg,rgba(247,251,255,0.96)_0%,rgba(247,251,255,0.82)_38%,rgba(247,251,255,0.28)_68%,rgba(247,251,255,0.08)_100%)]" />
        <div className="absolute inset-y-0 left-0 w-full max-w-3xl bg-[radial-gradient(circle_at_left,rgba(20,184,166,0.12),transparent_55%)]" />

        <div className="relative mx-auto flex min-h-[min(92vh,900px)] w-full max-w-6xl flex-col justify-end px-4 pb-16 pt-28 sm:px-6 sm:pb-20 lg:justify-center lg:pb-24">
          <div className="max-w-xl space-y-6 text-[#0b1220]">
            <p className="animate-in-up font-heading text-5xl font-semibold tracking-tight sm:text-6xl lg:text-7xl">
              StudentPro
            </p>
            <h1
              className="animate-in-up font-heading text-3xl font-medium leading-[1.05] text-balance sm:text-4xl lg:text-[2.75rem]"
              style={{ animationDelay: "80ms" }}
            >
              Your Skills. Your Community. Your Opportunities.
            </h1>
            <p
              className="animate-in-up max-w-md text-base leading-relaxed text-[#5b6b7c] sm:text-lg"
              style={{ animationDelay: "140ms" }}
            >
              Students Helping Students in Vienna — connect directly and arrange every detail on
              your own.
            </p>
            <div className="animate-in-up flex flex-wrap gap-3 pt-1" style={{ animationDelay: "200ms" }}>
              <Button
                size="lg"
                className="h-11 rounded-xl px-5"
                render={<Link href="/requests" />}
              >
                Find Requests
                <ArrowUpRight className="h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-11 rounded-xl border-[#0b1220]/15 bg-white/70 px-5 backdrop-blur"
                render={<Link href="/requests/new" />}
              >
                Post a Request
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-[#d7e3ef] bg-white/70 py-8 backdrop-blur">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <form action="/requests" className="grid gap-3 md:grid-cols-[1fr_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-[#5b6b7c]" />
              <Input
                name="q"
                placeholder="What do you need help with?"
                className="h-12 rounded-xl border-[#d7e3ef] bg-[#f7fbff] pl-11"
              />
            </div>
            <Button type="submit" className="h-12 rounded-xl px-6">
              Search
            </Button>
          </form>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-[#2563EB] uppercase">
              Categories
            </p>
            <h2 className="mt-2 font-heading text-3xl font-semibold tracking-tight">
              What students help with
            </h2>
          </div>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {popular.map((category) => {
            const Icon = categoryIcons[category.slug] ?? HandHelping;
            return (
              <Link
                key={category.slug}
                href={`/requests?category=${category.slug}`}
                className="group flex min-w-[10.5rem] shrink-0 items-center gap-3 rounded-xl border border-[#d7e3ef] bg-white px-4 py-3 transition hover:border-[#2563EB]/40 hover:bg-[#e8f3ff]"
              >
                <Icon className="h-4 w-4 text-[#2563EB] transition group-hover:translate-x-0.5" />
                <span className="text-sm font-medium text-[#0b1220]">{category.name}</span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="border-y border-[#d7e3ef] bg-[#eef8f7] py-16">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <div className="mb-10 max-w-xl">
            <p className="text-xs font-semibold tracking-[0.2em] text-teal-700 uppercase">
              Process
            </p>
            <h2 className="mt-2 font-heading text-3xl font-semibold tracking-tight">
              How StudentPro Works
            </h2>
            <p className="mt-2 text-[#5b6b7c]">
              Four steps from student verification to an independent collaboration.
            </p>
          </div>
          <ol className="grid gap-0 md:grid-cols-4">
            {[
              "Verify your student status.",
              "Discover requests or offer your skills.",
              "Connect directly with another student.",
              "Agree on the details independently.",
            ].map((step, index) => (
              <li
                key={step}
                className="border-[#cfe3e1] py-4 md:border-l md:px-5 md:first:border-l-0 md:first:pl-0"
              >
                <div className="font-heading text-sm font-semibold tracking-[0.18em] text-teal-700">
                  STEP {index + 1}
                </div>
                <p className="mt-3 text-base font-medium leading-relaxed text-[#0b1220]">{step}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-[#2563EB] uppercase">
              Marketplace
            </p>
            <h2 className="mt-2 font-heading text-3xl font-semibold tracking-tight">
              Recent requests
            </h2>
            <p className="mt-2 text-[#5b6b7c]">
              {configured
                ? "Open requests from verified students."
                : "Connect Supabase to load live requests."}
            </p>
          </div>
          <Button variant="outline" className="rounded-xl" render={<Link href="/requests" />}>
            View all
            <ArrowUpRight className="h-4 w-4" />
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
          <div className="hairline rounded-2xl bg-white px-6 py-16 text-center">
            <p className="font-heading text-xl font-semibold">No open requests yet</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-[#5b6b7c]">
              Publish the first request and start connecting with verified students.
            </p>
            <Button className="mt-6 rounded-xl" render={<Link href="/requests/new" />}>
              Post a Request
            </Button>
          </div>
        )}
      </section>

      <section className="bg-[linear-gradient(180deg,#e8f3ff_0%,#f7fbff_55%,transparent_100%)] py-16">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <div className="mb-8 max-w-xl">
            <p className="text-xs font-semibold tracking-[0.2em] text-[#2563EB] uppercase">
              People
            </p>
            <h2 className="mt-2 font-heading text-3xl font-semibold tracking-tight">
              Featured verified students
            </h2>
            <p className="mt-2 text-[#5b6b7c]">
              Profiles appear only after verification. Ratings are peer feedback, not certification.
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
            <div className="hairline rounded-2xl bg-white/80 px-6 py-14 text-center text-sm text-[#5b6b7c]">
              Verified student profiles will appear here once Supabase is connected.
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl space-y-8 px-4 py-16 sm:px-6">
        <div className="max-w-xl">
          <p className="text-xs font-semibold tracking-[0.2em] text-teal-700 uppercase">Trust</p>
          <h2 className="mt-2 font-heading text-3xl font-semibold tracking-tight">
            Built for clear boundaries
          </h2>
        </div>
        <PlatformNotice />
        <div className="grid gap-6 md:grid-cols-3">
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
            <div key={item.title} className="border-t border-[#0b1220]/15 pt-5">
              <item.icon className="mb-4 h-5 w-5 text-[#2563EB]" />
              <h3 className="font-heading text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#5b6b7c]">{item.body}</p>
            </div>
          ))}
        </div>
      </section>
    </PublicShell>
  );
}
