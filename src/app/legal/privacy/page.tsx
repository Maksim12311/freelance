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

export const metadata = { title: "Privacy Policy" };

export default function Page() {
  return (
    <PublicShell forceMarketing>
      <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-10 sm:px-6">
        <h1 className="text-3xl font-semibold tracking-tight">Privacy Policy</h1>
        <DraftBanner />
        <Card>
          <CardContent className="space-y-8 pt-6">
          <section className="space-y-2">
            <h2 className="text-xl font-semibold">Controller</h2>
            <p className="text-slate-600 leading-relaxed whitespace-pre-line">Draft operator entity (placeholder): StudentPro, Vienna, Austria. Replace with legal entity details before launch.</p>
          </section>
          <section className="space-y-2">
            <h2 className="text-xl font-semibold">Data we process</h2>
            <p className="text-slate-600 leading-relaxed whitespace-pre-line">Account data, university affiliation evidence, profile content, requests, applications, messages, reports, and technical logs necessary to operate the marketplace.</p>
          </section>
          <section className="space-y-2">
            <h2 className="text-xl font-semibold">Verification documents</h2>
            <p className="text-slate-600 leading-relaxed whitespace-pre-line">Enrollment documents are stored privately in restricted storage, accessible only to authorized administrators, and may be deleted after configurable retention.</p>
          </section>
          <section className="space-y-2">
            <h2 className="text-xl font-semibold">Legal bases</h2>
            <p className="text-slate-600 leading-relaxed whitespace-pre-line">Draft references to contract performance, legitimate interests, and consent where required under GDPR. Finalize with counsel.</p>
          </section>
          <section className="space-y-2">
            <h2 className="text-xl font-semibold">Rights</h2>
            <p className="text-slate-600 leading-relaxed whitespace-pre-line">Users may request access, rectification, erasure, restriction, portability, and objection via Settings export/deletion flows and contact channels.</p>
          </section>
          <section className="space-y-2">
            <h2 className="text-xl font-semibold">DSA / platform notes</h2>
            <p className="text-slate-600 leading-relaxed whitespace-pre-line">Reporting channels exist for illegal content. Moderation decisions may be challenged through appeal fields on reports.</p>
          </section>
          </CardContent>
        </Card>
      </div>
    </PublicShell>
  );
}
