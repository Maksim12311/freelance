import Link from "next/link";
import { PublicShell } from "@/components/layout/public-shell";
import { PlatformNotice } from "@/components/shared/platform-notice";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Safety" };

export default function SafetyPage() {
  return (
    <PublicShell>
      <div className="mx-auto w-full max-w-3xl space-y-8 px-4 py-12 sm:px-6">
        <div className="space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight">Safety</h1>
          <p className="text-slate-600">
            Practical guidance for collaborating with other students on and off the platform.
          </p>
        </div>
        <PlatformNotice title="Verification is not a safety guarantee">
          Verified student status means affiliation evidence was reviewed. It does not prove
          trustworthiness, legal work authorization, or service quality.
        </PlatformNotice>
        <div className="space-y-4 text-slate-600 leading-relaxed">
          <p>
            Prefer public places for in-person collaborations. Tell a friend where you are meeting
            and keep personal identity documents out of public chats.
          </p>
          <p>
            Agree on scope, timing, and any payment details directly and clearly. StudentPro does
            not process service payments or escrow funds.
          </p>
          <p>
            Use report tools on requests, profiles, messages, and reviews when something looks
            suspicious. Admins can hide content and suspend accounts.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" render={<Link href="/legal/moderation" />}>Reporting & moderation</Button>
          <Button variant="outline" render={<Link href="/legal/community-guidelines" />}>Community guidelines</Button>
        </div>
      </div>
    </PublicShell>
  );
}
