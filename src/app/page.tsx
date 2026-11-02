import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  HandHelping,
  MessagesSquare,
  Sparkles,
} from "lucide-react";
import { PublicShell } from "@/components/layout/public-shell";
import { Reveal, Section } from "@/components/shared/reveal";
import { Button } from "@/components/ui/button";
import { getCurrentProfile, isVerificationActive } from "@/lib/auth";

const features = [
  {
    title: "Find Help",
    text: "Post what you need — tutoring, design, moving, tech — and get offers from students nearby.",
    icon: HandHelping,
  },
  {
    title: "Offer Your Skills",
    text: "Share what you’re good at and discover requests that match your time and talent.",
    icon: Sparkles,
  },
  {
    title: "Connect Directly",
    text: "Message each other, agree on details, and arrange everything yourselves.",
    icon: MessagesSquare,
  },
  {
    title: "Verified Students",
    text: "Only verified university students can browse and post inside the marketplace.",
    icon: BadgeCheck,
  },
];

const categories = [
  "Photography",
  "Video Editing",
  "Design",
  "Tutoring",
  "Tech Help",
  "Moving",
  "Languages",
  "Everyday Help",
];

const steps = [
  {
    n: "01",
    title: "Sign Up & Verify",
    text: "Create your account and confirm you’re a university student in Vienna.",
  },
  {
    n: "02",
    title: "Find or Post a Request",
    text: "Browse opportunities or ask for help with studies, creative work, and everyday tasks.",
  },
  {
    n: "03",
    title: "Connect & Arrange",
    text: "Message directly, agree on timing and details, and help each other.",
  },
];

export default async function HomePage() {
  const profile = await getCurrentProfile();
  const verified = profile
    ? isVerificationActive(profile) || profile.is_admin
    : false;

  const primaryHref = !profile
    ? "/signup"
    : verified
      ? "/dashboard"
      : "/verify-student";
  const primaryLabel = !profile
    ? "Join StudentPro"
    : verified
      ? "Go to dashboard"
      : "Complete verification";

  return (
    <PublicShell>
      {/* Hero */}
      <section className="relative isolate min-h-[calc(100vh-4rem)] overflow-hidden text-white">
        <Image
          src="/hero.jpg"
          alt="University student workspace overlooking Vienna"
          fill
          priority
          className="hero-media object-cover object-[center_35%]"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#2a2124]/90 via-[#2a2124]/55 to-[#e11d48]/15" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#2a2124]/80 via-transparent to-[#2a2124]/35" />

        <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl flex-col justify-end px-4 pb-20 pt-24 sm:px-6 sm:pb-24 lg:pb-28">
          <p className="reveal font-heading text-5xl font-semibold tracking-tight sm:text-6xl md:text-7xl">
            StudentPro
          </p>
          <p className="reveal reveal-delay-1 mt-5 inline-flex max-w-fit rounded-full bg-white/12 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-white/95 ring-1 ring-white/25 backdrop-blur-sm sm:text-[13px]">
            Exclusively for university students in Vienna
          </p>
          <h1 className="reveal reveal-delay-2 mt-6 max-w-3xl font-heading text-3xl font-semibold leading-[1.1] tracking-tight sm:text-4xl md:text-5xl lg:text-[3.35rem]">
            Your Campus. Your People. Your Opportunities.
          </h1>
          <p className="reveal reveal-delay-3 mt-5 max-w-xl text-base leading-relaxed text-white/78 sm:text-lg">
            Need help with something? Have skills to offer? Connect with verified students,
            discover opportunities, and help each other.
          </p>
          <div className="reveal reveal-delay-4 mt-9 flex flex-wrap gap-3">
            <Button
              size="lg"
              className="h-12 rounded-2xl bg-[#e11d48] px-6 text-base shadow-[0_18px_40px_-18px_rgba(225,29,72,0.85)] hover:bg-[#be123c]"
              render={<Link href={primaryHref} />}
            >
              {primaryLabel}
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Link
              href="#how-it-works"
              className="inline-flex h-12 items-center justify-center rounded-2xl border border-white/35 bg-white/10 px-6 text-base font-medium text-white backdrop-blur-sm transition duration-300 hover:bg-white/20"
            >
              How It Works
            </Link>
          </div>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#fff5f6] to-transparent" />
      </section>

      {/* Features */}
      <Section delay={30}>
        <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#e11d48]">
              Why StudentPro
            </p>
            <h2 className="mt-3 font-heading text-3xl font-semibold tracking-tight text-[#2a2124] sm:text-4xl">
              A private marketplace built for campus life
            </h2>
            <p className="mt-3 text-base leading-relaxed text-[#6f5f64] sm:text-lg">
              Clean tools for real student collaboration — no public browse, no noise.
            </p>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Reveal key={feature.title} delay={90 + index * 100}>
                  <div className="block-card group flex h-full flex-col rounded-[1.4rem] bg-white/95 p-6 shadow-[0_18px_40px_-30px_rgba(225,29,72,0.35)] ring-1 ring-[#f0d5db]">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#ffe8ec] text-[#e11d48] transition duration-500 group-hover:bg-[#e11d48] group-hover:text-white group-hover:shadow-[0_12px_24px_-12px_rgba(225,29,72,0.8)]">
                      <Icon className="h-5 w-5" />
                    </span>
                    <h3 className="mt-5 font-heading text-xl font-semibold tracking-tight text-[#2a2124]">
                      {feature.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-[#6f5f64]">{feature.text}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </Section>

      {/* Categories */}
      <Section delay={50}>
        <div className="rose-wash">
          <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#e11d48]">
                Popular categories
              </p>
              <h2 className="mt-3 font-heading text-3xl font-semibold tracking-tight text-[#2a2124] sm:text-4xl">
                What students help each other with
              </h2>
              <p className="mt-3 text-base leading-relaxed text-[#6f5f64] sm:text-lg">
                Join to unlock the private board. Categories are a preview — not a public feed.
              </p>
            </div>

            <div className="mt-10 flex flex-wrap gap-3">
              {categories.map((name, index) => (
                <Reveal key={name} delay={70 + index * 55}>
                  <span className="chip-soft inline-flex rounded-2xl bg-white/90 px-4 py-3 font-heading text-base font-semibold tracking-tight text-[#2a2124] shadow-[0_12px_28px_-22px_rgba(225,29,72,0.4)] ring-1 ring-[#f0d5db] hover:bg-[#e11d48] hover:text-white hover:shadow-[0_16px_32px_-18px_rgba(225,29,72,0.55)] hover:ring-[#e11d48] sm:px-5 sm:text-lg">
                    {name}
                  </span>
                </Reveal>
              ))}
            </div>

            <div className="mt-10">
              <Button
                className="rounded-xl bg-[#e11d48] hover:bg-[#be123c]"
                render={<Link href="/signup" />}
              >
                Join to explore categories
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </Section>

      {/* How It Works */}
      <section id="how-it-works" className="relative scroll-mt-20 overflow-hidden">
        <div className="petal-panel relative overflow-hidden">
          <div className="pointer-events-none absolute -right-10 top-8 h-64 w-64 rounded-full bg-[#e11d48]/10 blur-3xl glow-soft" />
          <div className="pointer-events-none absolute -left-12 bottom-0 h-56 w-56 rounded-full bg-[#fb7185]/15 blur-3xl glow-soft" />
          <div className="relative mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
            <Reveal>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#e11d48]">
                How it works
              </p>
              <h2 className="mt-3 max-w-xl font-heading text-3xl font-semibold tracking-tight text-[#2a2124] sm:text-4xl">
                Three steps to your student community
              </h2>
            </Reveal>

            <ol className="mt-14 grid gap-5 md:grid-cols-3">
              {steps.map((step, index) => (
                <Reveal key={step.n} delay={110 + index * 130}>
                  <li className="block-card group relative h-full overflow-hidden rounded-[1.5rem] bg-white/85 p-7 shadow-[0_20px_44px_-30px_rgba(225,29,72,0.4)] ring-1 ring-[#f0d5db] backdrop-blur-sm">
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-gradient-to-r from-[#e11d48] to-[#fb7185] transition duration-700 group-hover:scale-x-100" />
                    <p className="font-heading text-5xl font-semibold leading-none text-[#e11d48]/25 transition duration-500 group-hover:text-[#e11d48]/45 sm:text-6xl">
                      {step.n}
                    </p>
                    <h3 className="mt-5 font-heading text-xl font-semibold text-[#2a2124] sm:text-2xl">
                      {step.title}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-[#6f5f64] sm:text-base">
                      {step.text}
                    </p>
                    <div className="draw-underline mt-6 h-px w-16 bg-gradient-to-r from-[#e11d48] to-transparent" />
                  </li>
                </Reveal>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <Section delay={80}>
        <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
          <Reveal>
            <div className="relative overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-[#e11d48] via-[#e43b5f] to-[#be123c] px-6 py-14 text-white shadow-[0_32px_64px_-28px_rgba(225,29,72,0.5)] sm:px-12 sm:py-16">
              <div className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full bg-white/20 blur-3xl glow-soft" />
              <div className="pointer-events-none absolute -bottom-20 left-8 h-48 w-48 rounded-full bg-[#fda4af]/30 blur-3xl" />
              <div className="relative max-w-2xl">
                <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
                  Your Student Community Starts Here.
                </h2>
                <p className="mt-4 max-w-lg text-base leading-relaxed text-white/85 sm:text-lg">
                  Create your account, verify your student status, and join a private network of
                  university students in Vienna.
                </p>
                <div className="mt-8">
                  <Button
                    size="lg"
                    className="h-12 rounded-2xl bg-white px-6 text-base text-[#e11d48] hover:bg-[#fff5f6]"
                    render={<Link href="/signup" />}
                  >
                    Create Your Account
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </Section>
    </PublicShell>
  );
}
