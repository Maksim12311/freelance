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

export const metadata = { title: "Impressum" };

export default function Page() {
  return (
    <PublicShell forceMarketing>
      <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-10 sm:px-6">
        <h1 className="text-3xl font-semibold tracking-tight">Impressum</h1>
        <DraftBanner />
        <Card>
          <CardContent className="space-y-8 pt-6">
          <section className="space-y-2">
            <h2 className="text-xl font-semibold">Operator (draft placeholder)</h2>
            <p className="text-slate-600 leading-relaxed whitespace-pre-line">{`StudentPro (working title)
Vienna, Austria
Email: legal@studentpro.example
Replace with registered business name, address, UID, and responsible person before launch.`}</p>
          </section>
          <section className="space-y-2">
            <h2 className="text-xl font-semibold">Hosting</h2>
            <p className="text-slate-600 leading-relaxed whitespace-pre-line">Application hosting and Supabase project details to be completed for production.</p>
          </section>
          <section className="space-y-2">
            <h2 className="text-xl font-semibold">Regulatory notice</h2>
            <p className="text-slate-600 leading-relaxed whitespace-pre-line">This Impressum is a draft placeholder for Austrian disclosure requirements and must be reviewed by qualified counsel.</p>
          </section>
          </CardContent>
        </Card>
      </div>
    </PublicShell>
  );
}
