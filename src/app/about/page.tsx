import Link from "next/link";
import { PublicShell } from "@/components/layout/public-shell";
import { PlatformNotice } from "@/components/shared/platform-notice";
import { Button } from "@/components/ui/button";
import { APP_NAME, TAGLINE } from "@/lib/constants";

export const metadata = { title: "About StudentPro" };

export default function AboutPage() {
  return (
    <PublicShell forceMarketing>
      <div className="mx-auto w-full max-w-3xl space-y-8 px-4 py-12 sm:px-6">
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#2563EB]">
            {APP_NAME}
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">About {APP_NAME}</h1>
          <p className="text-lg text-slate-600">{TAGLINE}</p>
        </div>
        <PlatformNotice />
        <div className="space-y-4 text-slate-600 leading-relaxed">
          <p>
            StudentPro is a Vienna-based marketplace connecting university students who need help
            with students who can offer skills. We focus on discovery, verification, messaging, and
            peer feedback — not employment or payment processing.
          </p>
          <p>
            Students publish requests, apply to help, and arrange collaboration details directly.
            Suggested budgets are optional guidance only. StudentPro does not employ students, hold
            customer funds, set mandatory prices, or guarantee service quality.
          </p>
          <p>
            Verification confirms university affiliation evidence reviewed by StudentPro. It is not
            proof of work authorization, professional certification, or trustworthiness.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button className="bg-[#2563EB] hover:bg-blue-700" render={<Link href="/how-it-works" />}>How it works</Button>
          <Button variant="outline" render={<Link href="/safety" />}>Safety</Button>
        </div>
      </div>
    </PublicShell>
  );
}
