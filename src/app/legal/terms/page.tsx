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

export const metadata = { title: "Terms of Service" };

export default function Page() {
  return (
    <PublicShell forceMarketing>
      <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-10 sm:px-6">
        <h1 className="text-3xl font-semibold tracking-tight">Terms of Service</h1>
        <DraftBanner />
        <Card>
          <CardContent className="space-y-8 pt-6">
          <section className="space-y-2">
            <h2 className="text-xl font-semibold">Nature of the platform</h2>
            <p className="text-slate-600 leading-relaxed whitespace-pre-line">StudentPro is a digital intermediary connecting university students in Vienna. StudentPro does not employ students, provide advertised services itself, process payments for services, hold customer money, set mandatory service prices, guarantee service quality, automatically assign workers, or control how services are performed.</p>
          </section>
          <section className="space-y-2">
            <h2 className="text-xl font-semibold">Independent arrangements</h2>
            <p className="text-slate-600 leading-relaxed whitespace-pre-line">Students communicate directly and independently agree on service conditions, timing, and any payment arrangements. Applications and messages do not create a legally binding service agreement through the platform alone.</p>
          </section>
          <section className="space-y-2">
            <h2 className="text-xl font-semibold">Student verification</h2>
            <p className="text-slate-600 leading-relaxed whitespace-pre-line">Verification indicates affiliation evidence reviewed by StudentPro. It does not prove authorization to perform paid work and does not replace Gewerbe, immigration, tax, or employment formalities.</p>
          </section>
          <section className="space-y-2">
            <h2 className="text-xl font-semibold">Acceptable use</h2>
            <p className="text-slate-600 leading-relaxed whitespace-pre-line">Users must not post illegal content, harass others, misrepresent verification, or attempt to circumvent security or moderation controls.</p>
          </section>
          <section className="space-y-2">
            <h2 className="text-xl font-semibold">Limitation language</h2>
            <p className="text-slate-600 leading-relaxed whitespace-pre-line">These draft terms are not absolute protection from liability and require review by a qualified Austrian legal professional before public launch.</p>
          </section>
          </CardContent>
        </Card>
      </div>
    </PublicShell>
  );
}
