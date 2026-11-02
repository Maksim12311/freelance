import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PublicShell } from "@/components/layout/public-shell";
import { RequestCard } from "@/components/shared/request-card";
import { Reveal } from "@/components/shared/reveal";
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
      <section className="relative overflow-hidden border-b border-[#f0e4d7]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(225,29,72,0.14),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(2,132,199,0.12),transparent_35%)]" />
        <div className="relative mx-auto w-full max-w-5xl px-4 py-14 sm:px-6 sm:py-16">
          <div className="reveal inline-flex items-center rounded-xl bg-white/85 px-3 py-1.5 text-sm font-semibold text-[#e11d48] shadow-sm ring-1 ring-[#e11d48]/15">
            StudentPro · Vienna
          </div>
          <h1 className="reveal reveal-delay-1 mt-5 max-w-2xl font-heading text-4xl font-semibold tracking-tight text-stone-900 sm:text-5xl">
            Students helping students
          </h1>
          <p className="reveal reveal-delay-2 mt-4 max-w-xl text-lg leading-relaxed text-stone-600">
            Need help? Or can you help? Post a request, find another student, and talk directly.
          </p>
          <div className="reveal reveal-delay-3 mt-8 flex flex-wrap gap-3">
            <Button
              size="lg"
              className="h-11 rounded-xl bg-[#e11d48] px-5 hover:bg-rose-700"
              render={<Link href="/requests/new" />}
            >
              I need help
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-11 rounded-xl border-[#0284c7]/25 bg-white/85 px-5 text-[#075985] hover:bg-[#e0f2fe]"
              render={<Link href="/requests" />}
            >
              I can help
            </Button>
          </div>
          <p className="reveal reveal-delay-4 mt-4 text-sm text-stone-500">
            Free to use · StudentPro does not process payments for services
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
        <Reveal>
          <form
            action="/requests"
            className="flex flex-col gap-3 rounded-2xl bg-white p-3 shadow-[0_18px_40px_-28px_rgba(225,29,72,0.45)] ring-1 ring-[#f0e4d7] sm:flex-row"
          >
            <Input
              name="q"
              placeholder="Search: tutoring, moving, design…"
              className="h-11 flex-1 border-0 bg-[#fff7ed] shadow-none"
            />
            <Button type="submit" className="h-11 rounded-xl bg-[#e11d48] px-6 hover:bg-rose-700">
              Search
            </Button>
          </form>
        </Reveal>
      </section>

      <section className="mx-auto w-full max-w-5xl px-4 pb-12 sm:px-6">
        <Reveal>
          <h2 className="font-heading text-2xl font-semibold text-stone-900">Popular categories</h2>
        </Reveal>
        <div className="mt-4 flex flex-wrap gap-2">
          {popular.map((category, index) => (
            <Reveal key={category.slug} delay={index * 40}>
              <Link
                href={`/requests?category=${category.slug}`}
                className="inline-flex rounded-xl bg-[#ffedd5] px-3.5 py-2 text-sm font-medium text-[#9a3412] transition hover:-translate-y-0.5 hover:bg-[#e11d48] hover:text-white"
              >
                {category.name}
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="border-y border-[#f0e4d7] bg-white/75">
        <div className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6">
          <Reveal>
            <h2 className="font-heading text-2xl font-semibold text-stone-900">How it works</h2>
          </Reveal>
          <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { title: "Sign up", text: "Create an account with your university." },
              { title: "Verify", text: "Confirm you are a student." },
              { title: "Connect", text: "Post a request or offer to help." },
              { title: "Agree directly", text: "You decide details and payment yourselves." },
            ].map((step, index) => (
              <Reveal key={step.title} delay={index * 90}>
                <li className="h-full rounded-2xl bg-[#fff7ed] p-5 ring-1 ring-[#f0e4d7] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_36px_-24px_rgba(225,29,72,0.55)]">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#e11d48] text-sm font-bold text-white">
                    {index + 1}
                  </div>
                  <p className="mt-4 font-heading text-base font-semibold text-stone-900">
                    {step.title}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-stone-600">{step.text}</p>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6">
        <Reveal>
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="font-heading text-2xl font-semibold text-stone-900">Open requests</h2>
              <p className="mt-1 text-sm text-stone-600">
                Things students need help with right now.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl border-[#0284c7]/25 text-[#075985]"
              render={<Link href="/requests" />}
            >
              See all
            </Button>
          </div>
        </Reveal>

        {recentRequests.length ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recentRequests.map((request, index) => (
              <Reveal key={request.id} delay={index * 70}>
                <RequestCard
                  request={{
                    ...request,
                    category: Array.isArray(request.category)
                      ? request.category[0]
                      : request.category,
                    owner: Array.isArray(request.owner) ? request.owner[0] : request.owner,
                  }}
                />
              </Reveal>
            ))}
          </div>
        ) : (
          <Reveal delay={100}>
            <div className="mt-6 rounded-2xl border border-dashed border-rose-200 bg-[#fff1f2] px-4 py-10 text-center">
              <p className="font-heading text-lg font-semibold text-stone-900">No requests yet</p>
              <p className="mt-1 text-sm text-stone-600">Be the first to ask for help.</p>
              <Button
                className="mt-4 rounded-xl bg-[#e11d48] hover:bg-rose-700"
                render={<Link href="/requests/new" />}
              >
                Ask for help
              </Button>
            </div>
          </Reveal>
        )}
      </section>

      <section className="border-t border-[#f0e4d7] bg-[#e0f2fe]/55">
        <div className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6">
          <Reveal>
            <h2 className="font-heading text-2xl font-semibold text-stone-900">Important</h2>
            <ul className="mt-4 space-y-2 text-sm leading-relaxed text-stone-600">
              <li>StudentPro only connects students. We do not employ anyone.</li>
              <li>We do not process payments for services.</li>
              <li>You agree on timing, price, and details yourselves.</li>
              <li>Student verification does not mean legal permission to do paid work.</li>
            </ul>
            <div className="mt-6">
              <Button
                variant="outline"
                className="rounded-xl border-[#0284c7]/30 bg-white text-[#075985] hover:bg-white"
                render={<Link href="/safety" />}
              >
                Safety tips
              </Button>
            </div>
          </Reveal>
        </div>
      </section>
    </PublicShell>
  );
}
