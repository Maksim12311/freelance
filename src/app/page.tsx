import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PublicShell } from "@/components/layout/public-shell";
import { RequestCard } from "@/components/shared/request-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getCategories, getRecentRequests, hasSupabaseEnv } from "@/lib/data";

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
  const [categories, recentRequests] = configured
    ? await Promise.all([getCategories(), getRecentRequests(6)])
    : [[], []];
  const popular = categories.length ? categories : fallbackCategories;

  return (
    <PublicShell>
      <section className="relative overflow-hidden border-b border-[#dbe7f5]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.16),transparent_42%),radial-gradient(circle_at_bottom_left,rgba(15,118,110,0.12),transparent_36%)]" />
        <div className="relative mx-auto w-full max-w-5xl px-4 py-14 sm:px-6 sm:py-16">
          <div className="inline-flex items-center rounded-xl bg-white/80 px-3 py-1.5 text-sm font-semibold text-[#2563EB] shadow-sm ring-1 ring-[#2563EB]/15">
            StudentPro · Vienna
          </div>
          <h1 className="mt-5 max-w-2xl font-heading text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
            Students helping students
          </h1>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-slate-600">
            Need help? Or can you help? Post a request, find another student, and talk directly.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button
              size="lg"
              className="h-11 rounded-xl bg-[#2563EB] px-5 hover:bg-blue-700"
              render={<Link href="/requests/new" />}
            >
              I need help
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-11 rounded-xl border-[#2563EB]/20 bg-white/80 px-5 text-[#1e3a8a] hover:bg-[#eff6ff]"
              render={<Link href="/requests" />}
            >
              I can help
            </Button>
          </div>
          <p className="mt-4 text-sm text-slate-500">
            Free to use · StudentPro does not process payments for services
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
        <form
          action="/requests"
          className="flex flex-col gap-3 rounded-2xl bg-white p-3 shadow-[0_18px_40px_-28px_rgba(37,99,235,0.45)] ring-1 ring-[#dbe7f5] sm:flex-row"
        >
          <Input
            name="q"
            placeholder="Search: tutoring, moving, design…"
            className="h-11 flex-1 border-0 bg-[#f7faff] shadow-none"
          />
          <Button type="submit" className="h-11 rounded-xl px-6">
            Search
          </Button>
        </form>
      </section>

      <section className="mx-auto w-full max-w-5xl px-4 pb-12 sm:px-6">
        <h2 className="font-heading text-2xl font-semibold text-slate-900">Popular categories</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {popular.map((category) => (
            <Link
              key={category.slug}
              href={`/requests?category=${category.slug}`}
              className="rounded-xl bg-[#eaf2ff] px-3.5 py-2 text-sm font-medium text-[#1e3a8a] transition hover:bg-[#2563EB] hover:text-white"
            >
              {category.name}
            </Link>
          ))}
        </div>
      </section>

      <section className="border-y border-[#dbe7f5] bg-white/70">
        <div className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6">
          <h2 className="font-heading text-2xl font-semibold text-slate-900">How it works</h2>
          <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { title: "Sign up", text: "Create an account with your university." },
              { title: "Verify", text: "Confirm you are a student." },
              { title: "Connect", text: "Post a request or offer to help." },
              { title: "Agree directly", text: "You decide details and payment yourselves." },
            ].map((step, index) => (
              <li
                key={step.title}
                className="rounded-2xl bg-[#f7faff] p-5 ring-1 ring-[#dbe7f5]"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2563EB] text-sm font-bold text-white">
                  {index + 1}
                </div>
                <p className="mt-4 font-heading text-base font-semibold text-slate-900">
                  {step.title}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-heading text-2xl font-semibold text-slate-900">Open requests</h2>
            <p className="mt-1 text-sm text-slate-600">Things students need help with right now.</p>
          </div>
          <Button variant="outline" size="sm" className="rounded-xl" render={<Link href="/requests" />}>
            See all
          </Button>
        </div>

        {recentRequests.length ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
          <div className="mt-6 rounded-2xl border border-dashed border-[#93c5fd] bg-[#eff6ff] px-4 py-10 text-center">
            <p className="font-heading text-lg font-semibold text-slate-900">No requests yet</p>
            <p className="mt-1 text-sm text-slate-600">Be the first to ask for help.</p>
            <Button className="mt-4 rounded-xl" render={<Link href="/requests/new" />}>
              Ask for help
            </Button>
          </div>
        )}
      </section>

      <section className="border-t border-[#dbe7f5] bg-[#e6f7f4]/55">
        <div className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6">
          <h2 className="font-heading text-2xl font-semibold text-slate-900">Important</h2>
          <ul className="mt-4 space-y-2 text-sm leading-relaxed text-slate-600">
            <li>StudentPro only connects students. We do not employ anyone.</li>
            <li>We do not process payments for services.</li>
            <li>You agree on timing, price, and details yourselves.</li>
            <li>Student verification does not mean legal permission to do paid work.</li>
          </ul>
          <div className="mt-6">
            <Button
              variant="outline"
              className="rounded-xl border-[#0f766e]/25 bg-white text-[#0f766e] hover:bg-white"
              render={<Link href="/safety" />}
            >
              Safety tips
            </Button>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
