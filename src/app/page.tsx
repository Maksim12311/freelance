import Link from "next/link";
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
      <section className="border-b border-slate-200 bg-slate-50">
        <div className="mx-auto w-full max-w-5xl px-4 py-14 sm:px-6 sm:py-16">
          <p className="text-sm font-semibold text-[#2563EB]">StudentPro</p>
          <h1 className="mt-3 max-w-2xl font-heading text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Students helping students in Vienna
          </h1>
          <p className="mt-4 max-w-xl text-lg text-slate-600">
            Need help with something? Or can you help another student? Post a request, browse
            offers, and talk directly.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" render={<Link href="/requests/new" />}>
              I need help
            </Button>
            <Button size="lg" variant="outline" render={<Link href="/requests" />}>
              I can help
            </Button>
          </div>
          <p className="mt-4 text-sm text-slate-500">
            Free to use. StudentPro does not process payments for services.
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
        <form action="/requests" className="flex flex-col gap-3 sm:flex-row">
          <Input
            name="q"
            placeholder="Search: tutoring, moving, design…"
            className="h-11 flex-1"
          />
          <Button type="submit" className="h-11 px-6">
            Search
          </Button>
        </form>
      </section>

      <section className="mx-auto w-full max-w-5xl px-4 pb-12 sm:px-6">
        <h2 className="font-heading text-xl font-semibold">Popular categories</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {popular.map((category) => (
            <Link
              key={category.slug}
              href={`/requests?category=${category.slug}`}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:border-slate-300 hover:bg-slate-50"
            >
              {category.name}
            </Link>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6">
          <h2 className="font-heading text-xl font-semibold">How it works</h2>
          <ol className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { title: "1. Sign up", text: "Create an account with your university." },
              { title: "2. Verify", text: "Confirm you are a student." },
              { title: "3. Connect", text: "Post a request or apply to help." },
              { title: "4. Agree directly", text: "You decide details and payment yourselves." },
            ].map((step) => (
              <li key={step.title}>
                <p className="font-medium text-slate-900">{step.title}</p>
                <p className="mt-1 text-sm text-slate-600">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-heading text-xl font-semibold">Open requests</h2>
            <p className="mt-1 text-sm text-slate-600">Things students need help with right now.</p>
          </div>
          <Button variant="outline" size="sm" render={<Link href="/requests" />}>
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
          <div className="mt-6 rounded-xl border border-dashed border-slate-300 px-4 py-10 text-center">
            <p className="font-medium text-slate-900">No requests yet</p>
            <p className="mt-1 text-sm text-slate-600">Be the first to ask for help.</p>
            <Button className="mt-4" render={<Link href="/requests/new" />}>
              Ask for help
            </Button>
          </div>
        )}
      </section>

      <section className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6">
          <h2 className="font-heading text-xl font-semibold">Important</h2>
          <ul className="mt-4 space-y-2 text-sm text-slate-600">
            <li>StudentPro only connects students. We do not employ anyone.</li>
            <li>We do not process payments for services.</li>
            <li>You agree on timing, price, and details yourselves.</li>
            <li>Student verification does not mean legal permission to do paid work.</li>
          </ul>
          <div className="mt-6">
            <Button variant="outline" render={<Link href="/safety" />}>
              Safety tips
            </Button>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
