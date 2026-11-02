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

export const metadata = { title: "Community Guidelines" };

export default function Page() {
  return (
    <PublicShell forceMarketing>
      <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-10 sm:px-6">
        <h1 className="text-3xl font-semibold tracking-tight">Community Guidelines</h1>
        <DraftBanner />
        <Card>
          <CardContent className="space-y-8 pt-6">
          <section className="space-y-2">
            <h2 className="text-xl font-semibold">Be respectful</h2>
            <p className="text-slate-600 leading-relaxed whitespace-pre-line">Communicate professionally. Harassment, hate, and discrimination are not allowed.</p>
          </section>
          <section className="space-y-2">
            <h2 className="text-xl font-semibold">Be honest</h2>
            <p className="text-slate-600 leading-relaxed whitespace-pre-line">Do not fake student status, skills, or reviews.</p>
          </section>
          <section className="space-y-2">
            <h2 className="text-xl font-semibold">Stay lawful</h2>
            <p className="text-slate-600 leading-relaxed whitespace-pre-line">Users are responsible for complying with employment, immigration, tax, and business registration rules applicable to them.</p>
          </section>
          <section className="space-y-2">
            <h2 className="text-xl font-semibold">No payment processing via StudentPro</h2>
            <p className="text-slate-600 leading-relaxed whitespace-pre-line">Do not expect escrow, wallets, or platform commissions in the MVP.</p>
          </section>
          </CardContent>
        </Card>
      </div>
    </PublicShell>
  );
}
