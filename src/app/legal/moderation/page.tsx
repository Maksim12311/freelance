import { PublicShell } from "@/components/layout/public-shell";
import { LEGAL_DRAFT_BANNER } from "@/lib/constants";
import { Card, CardContent } from "@/components/ui/card";

function DraftBanner() {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
      {LEGAL_DRAFT_BANNER}
    </div>
  );
}

export const metadata = { title: "Reporting and Moderation Policy" };

export default function Page() {
  return (
    <PublicShell>
      <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-10 sm:px-6">
        <h1 className="text-3xl font-semibold tracking-tight">Reporting and Moderation Policy</h1>
        <DraftBanner />
        <Card>
          <CardContent className="space-y-8 pt-6">
          <section className="space-y-2">
            <h2 className="text-xl font-semibold">How to report</h2>
            <p className="text-slate-600 leading-relaxed whitespace-pre-line">Use in-product report forms on requests, profiles, messages, reviews, and applications.</p>
          </section>
          <section className="space-y-2">
            <h2 className="text-xl font-semibold">Review process</h2>
            <p className="text-slate-600 leading-relaxed whitespace-pre-line">Administrators triage open reports, may hide content, suspend accounts, and log actions in audit logs.</p>
          </section>
          <section className="space-y-2">
            <h2 className="text-xl font-semibold">Appeals</h2>
            <p className="text-slate-600 leading-relaxed whitespace-pre-line">Users may submit an appeal text against moderation outcomes for further review.</p>
          </section>
          <section className="space-y-2">
            <h2 className="text-xl font-semibold">Illegal content</h2>
            <p className="text-slate-600 leading-relaxed whitespace-pre-line">Reports of illegal content are prioritized. This draft policy must be aligned with DSA obligations before launch.</p>
          </section>
          </CardContent>
        </Card>
      </div>
    </PublicShell>
  );
}
