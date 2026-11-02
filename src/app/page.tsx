import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Search } from "lucide-react";
import { PublicShell } from "@/components/layout/public-shell";
import { RequestCard } from "@/components/shared/request-card";
import { Reveal, Section } from "@/components/shared/reveal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getCurrentProfile, isVerificationActive } from "@/lib/auth";
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

const steps = [
  {
    n: "01",
    title: "Sign up",
    text: "Join with your university email and say what you study.",
  },
  {
    n: "02",
    title: "Verify",
    text: "Confirm you are a student so others know they can trust you.",
  },
  {
    n: "03",
    title: "Connect",
    text: "Post what you need — or browse and offer to help.",
  },
  {
    n: "04",
    title: "Agree directly",
    text: "You decide timing, details, and payment yourselves.",
  },
];

function gateHref(path: string, access: "guest" | "unverified" | "verified") {
  if (access === "verified") return path;
  if (access === "unverified") {
    return `/verify-student?next=${encodeURIComponent(path)}`;
  }
  return `/signup?next=${encodeURIComponent(path)}`;
}

export default async function HomePage() {
  const profile = await getCurrentProfile();
  const verified = profile
    ? isVerificationActive(profile) || profile.is_admin
    : false;
  const access: "guest" | "unverified" | "verified" = !profile
    ? "guest"
    : verified
      ? "verified"
      : "unverified";

  const configured = hasSupabaseEnv();
  const categories = configured ? await getCategories() : [];
  const recentRequests =
    configured && verified ? await getRecentRequests(6) : [];
  const popular = categories.length ? categories : fallbackCategories;

  const needHelpHref = gateHref("/requests/new", access);
  const canHelpHref = gateHref("/requests", access);
  const browseHref = gateHref("/requests", access);

  return (
    <PublicShell>
      <section className="relative isolate min-h-[calc(100vh-4rem)] overflow-hidden text-white">
        <Image
          src="/hero.jpg"
          alt="Student desk overlooking Vienna"
          fill
          priority
          className="hero-media object-cover object-center"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-stone-950/85 via-stone-950/55 to-stone-950/25" />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950/70 via-transparent to-stone-950/30" />

        <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl flex-col justify-end px-4 pb-20 pt-24 sm:px-6 sm:pb-24 lg:pb-28">
          <p className="reveal font-heading text-5xl font-semibold tracking-tight text-white sm:text-6xl md:text-7xl lg:text-8xl">
            StudentPro
          </p>
          <h1 className="reveal reveal-delay-1 mt-5 max-w-xl font-heading text-2xl font-medium leading-snug text-white/95 sm:text-3xl md:text-4xl">
            A private marketplace for verified students in Vienna
          </h1>
          <p className="reveal reveal-delay-2 mt-4 max-w-md text-base leading-relaxed text-white/75 sm:text-lg">
            Sign up, verify your student status, then ask for help or offer yours —
            only students can see requests.
          </p>
          <div className="reveal reveal-delay-3 mt-9 flex flex-wrap gap-3">
            <Button
              size="lg"
              className="h-12 rounded-2xl bg-[#e11d48] px-6 text-base shadow-[0_18px_40px_-18px_rgba(225,29,72,0.9)] hover:bg-rose-700"
              render={<Link href={needHelpHref} />}
            >
              {access === "guest" ? "Sign up to get help" : "I need help"}
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-12 rounded-2xl border-white/35 bg-white/10 px-6 text-base text-white backdrop-blur-sm hover:bg-white/20 hover:text-white"
              render={<Link href={canHelpHref} />}
            >
              {access === "guest" ? "Sign up to help" : "I can help"}
            </Button>
          </div>
        </div>
      </section>

      <section className="relative -mt-8 z-10">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <Reveal>
            {verified ? (
              <form
                action="/requests"
                className="flex flex-col gap-3 rounded-[1.35rem] bg-white p-3 shadow-[0_28px_60px_-28px_rgba(28,25,23,0.35)] ring-1 ring-[#edd9cb] sm:flex-row sm:items-center sm:p-2.5"
              >
                <div className="flex flex-1 items-center gap-3 px-3">
                  <Search className="h-5 w-5 shrink-0 text-[#e11d48]" />
                  <Input
                    name="q"
                    placeholder="Search tutoring, moving, design…"
                    className="h-11 border-0 bg-transparent shadow-none focus-visible:ring-0"
                  />
                </div>
                <Button
                  type="submit"
                  className="h-11 shrink-0 rounded-xl bg-[#e11d48] px-7 hover:bg-rose-700 sm:h-12"
                >
                  Search
                </Button>
              </form>
            ) : (
              <Link
                href={gateHref("/requests", access)}
                className="flex flex-col gap-3 rounded-[1.35rem] bg-white p-3 shadow-[0_28px_60px_-28px_rgba(28,25,23,0.35)] ring-1 ring-[#edd9cb] transition hover:ring-[#e11d48]/40 sm:flex-row sm:items-center sm:p-2.5"
              >
                <div className="flex flex-1 items-center gap-3 px-3">
                  <Search className="h-5 w-5 shrink-0 text-[#e11d48]" />
                  <span className="py-2.5 text-sm text-stone-500">
                    {access === "guest"
                      ? "Sign up to search student requests…"
                      : "Verify your student status to search requests…"}
                  </span>
                </div>
                <span className="inline-flex h-11 shrink-0 items-center justify-center rounded-xl bg-[#e11d48] px-7 text-sm font-medium text-white sm:h-12">
                  {access === "guest" ? "Sign up" : "Verify"}
                </span>
              </Link>
            )}
          </Reveal>
        </div>
      </section>

      <Section delay={40}>
        <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#e11d48]">
                Browse
              </p>
              <h2 className="mt-2 font-heading text-3xl font-semibold text-stone-900 sm:text-4xl">
                What do you need?
              </h2>
            </div>
            <Link
              href={browseHref}
              className="inline-flex items-center gap-1 text-sm font-semibold text-[#075985] transition hover:text-[#e11d48]"
            >
              {access === "guest" ? "Sign up to browse" : "All requests"}
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-10 grid auto-rows-[140px] gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
            {popular.map((category, index) => {
              const wide = index === 0 || index === 5;
              const tones = [
                "bg-[#e11d48] text-white hover:bg-rose-700",
                "bg-[#0284c7] text-white hover:bg-sky-700",
                "bg-[#ffe4d6] text-[#9a3412] hover:bg-[#ffd6bf]",
                "bg-white text-stone-900 ring-1 ring-[#edd9cb] hover:ring-[#e11d48]/40",
                "bg-[#dff3ff] text-[#075985] hover:bg-[#ccebff]",
                "bg-stone-900 text-white hover:bg-stone-800",
                "bg-[#fff1e8] text-stone-900 ring-1 ring-[#edd9cb] hover:bg-[#ffe4d6]",
                "bg-[#fb7185] text-white hover:bg-rose-400",
              ];
              const categoryPath = `/requests?category=${category.slug}`;
              return (
                <Reveal
                  key={category.slug}
                  delay={60 + index * 50}
                  className={wide ? "sm:col-span-2" : undefined}
                >
                  <Link
                    href={gateHref(categoryPath, access)}
                    className={`group relative flex h-full flex-col justify-between overflow-hidden rounded-[1.35rem] p-5 transition duration-400 hover:-translate-y-1 hover:shadow-[0_24px_40px_-24px_rgba(28,25,23,0.35)] sm:p-6 ${tones[index % tones.length]}`}
                  >
                    <span className="font-heading text-sm font-semibold opacity-55">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="flex items-end justify-between gap-3">
                      <span className="font-heading text-xl font-semibold tracking-tight sm:text-2xl">
                        {category.name}
                      </span>
                      <ArrowUpRight className="mb-0.5 h-5 w-5 shrink-0 opacity-70 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:opacity-100" />
                    </span>
                  </Link>
                </Reveal>
              );
            })}
          </div>
        </div>
      </Section>

      <Section delay={60}>
        <div className="relative overflow-hidden bg-[#1c1917] text-white">
          <div className="pointer-events-none absolute -right-20 top-0 h-80 w-80 rounded-full bg-[#e11d48]/25 blur-3xl" />
          <div className="pointer-events-none absolute -left-16 bottom-0 h-72 w-72 rounded-full bg-[#0284c7]/20 blur-3xl" />
          <div className="relative mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#fb7185]">
              Simple flow
            </p>
            <h2 className="mt-2 max-w-lg font-heading text-3xl font-semibold sm:text-4xl">
              Four steps. Then you talk directly.
            </h2>

            <ol className="mt-16 grid gap-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
              {steps.map((step, index) => (
                <Reveal key={step.n} delay={80 + index * 110}>
                  <li>
                    <p className="font-heading text-5xl font-semibold leading-none text-[#e11d48] sm:text-6xl">
                      {step.n}
                    </p>
                    <p className="mt-5 font-heading text-xl font-semibold">{step.title}</p>
                    <p className="mt-2 text-sm leading-relaxed text-white/65">{step.text}</p>
                    <div className="draw-underline mt-6 h-px w-16 bg-gradient-to-r from-[#e11d48] to-transparent" />
                  </li>
                </Reveal>
              ))}
            </ol>
          </div>
        </div>
      </Section>

      <Section delay={80}>
        <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#0284c7]">
                Live board
              </p>
              <h2 className="mt-2 font-heading text-3xl font-semibold text-stone-900 sm:text-4xl">
                Open requests
              </h2>
              <p className="mt-2 max-w-md text-base text-stone-600">
                {verified
                  ? "Things students need help with right now."
                  : "Request details are private — only verified students can browse them."}
              </p>
            </div>
            <Button
              variant="outline"
              className="rounded-xl border-[#0284c7]/30 text-[#075985] hover:bg-[#e0f2fe]"
              render={<Link href={browseHref} />}
            >
              {access === "guest" ? "Sign up" : access === "unverified" ? "Verify to browse" : "See all"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          {verified && recentRequests.length ? (
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {recentRequests.map((request, index) => (
                <Reveal key={request.id} delay={100 + index * 90}>
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
              <div className="mt-10 overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-[#fff1f2] via-white to-[#e0f2fe] px-6 py-14 text-center ring-1 ring-[#edd9cb]">
                <p className="font-heading text-3xl font-semibold text-stone-900">
                  {verified ? "Be the first" : "Private to verified students"}
                </p>
                <p className="mx-auto mt-3 max-w-md text-base text-stone-600">
                  {verified
                    ? "No open requests yet. Ask for help — photography, tutoring, moving, anything."
                    : access === "guest"
                      ? "Create an account and verify your student status to see open requests."
                      : "Complete student verification to unlock the marketplace."}
                </p>
                <Button
                  className="mt-7 rounded-xl bg-[#e11d48] hover:bg-rose-700"
                  render={<Link href={needHelpHref} />}
                >
                  {access === "guest" ? "Sign up" : access === "unverified" ? "Verify now" : "Ask for help"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </Reveal>
          )}
        </div>
      </Section>

      <Section delay={100}>
        <div className="mx-auto w-full max-w-6xl px-4 pb-8 sm:px-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Reveal>
              <Link
                href={needHelpHref}
                className="group relative flex min-h-[300px] flex-col justify-between overflow-hidden rounded-[1.75rem] bg-[#e11d48] p-8 text-white shadow-[0_30px_60px_-28px_rgba(225,29,72,0.65)] transition duration-400 hover:-translate-y-1 sm:p-10"
              >
                <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-white/15 blur-2xl transition duration-500 group-hover:scale-125" />
                <div className="relative">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/70">
                    For you
                  </p>
                  <p className="mt-4 font-heading text-3xl font-semibold sm:text-4xl">
                    I need help
                  </p>
                  <p className="mt-3 max-w-xs text-base leading-relaxed text-white/80">
                    {access === "guest"
                      ? "Sign up and verify, then post what you need."
                      : "Post what you need. Students nearby can offer to help."}
                  </p>
                </div>
                <span className="relative mt-8 inline-flex items-center gap-2 text-sm font-semibold">
                  {access === "guest" ? "Sign up" : "Create a request"}
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </span>
              </Link>
            </Reveal>
            <Reveal delay={120}>
              <Link
                href={canHelpHref}
                className="group relative flex min-h-[300px] flex-col justify-between overflow-hidden rounded-[1.75rem] bg-[#0284c7] p-8 text-white shadow-[0_30px_60px_-28px_rgba(2,132,199,0.55)] transition duration-400 hover:-translate-y-1 sm:p-10"
              >
                <div className="pointer-events-none absolute -bottom-12 -left-8 h-48 w-48 rounded-full bg-white/15 blur-2xl transition duration-500 group-hover:scale-125" />
                <div className="relative">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/70">
                    Your skills
                  </p>
                  <p className="mt-4 font-heading text-3xl font-semibold sm:text-4xl">
                    I can help
                  </p>
                  <p className="mt-3 max-w-xs text-base leading-relaxed text-white/80">
                    {access === "guest"
                      ? "Join as a verified student to browse open requests."
                      : "Browse open requests and message someone who needs you."}
                  </p>
                </div>
                <span className="relative mt-8 inline-flex items-center gap-2 text-sm font-semibold">
                  {access === "guest" ? "Sign up" : "Browse requests"}
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </span>
              </Link>
            </Reveal>
          </div>
        </div>
      </Section>

      <Section delay={120}>
        <div className="sky-wash mt-8">
          <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#075985]">
              Keep in mind
            </p>
            <h2 className="mt-2 font-heading text-3xl font-semibold text-stone-900 sm:text-4xl">
              StudentPro only connects people
            </h2>
            <ul className="mt-8 max-w-2xl space-y-4 text-base leading-relaxed text-stone-700">
              <li className="flex gap-3">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#0284c7]" />
                We do not employ anyone and do not process payments for services.
              </li>
              <li className="flex gap-3">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#0284c7]" />
                You agree on timing, price, and details yourselves.
              </li>
              <li className="flex gap-3">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#0284c7]" />
                Student verification is not legal permission to do paid work.
              </li>
            </ul>
            <div className="mt-8">
              <Button
                variant="outline"
                className="rounded-xl border-[#0284c7]/35 bg-white/80 text-[#075985] hover:bg-white"
                render={<Link href="/safety" />}
              >
                Safety tips
              </Button>
            </div>
          </div>
        </div>
      </Section>
    </PublicShell>
  );
}
