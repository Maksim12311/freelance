import Link from "next/link";
import { PublicShell } from "@/components/layout/public-shell";
import { PlatformNotice } from "@/components/shared/platform-notice";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <PublicShell>
      <div className="mx-auto w-full max-w-3xl space-y-8 px-4 py-12 sm:px-6">
        <div className="space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight">Contact</h1>
          <p className="text-slate-600">
            Draft contact channels for support, legal notices, and DSA-related reports until
            production addresses are finalized.
          </p>
        </div>
        <PlatformNotice />
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-5 text-slate-700">
          <div>
            <p className="text-sm font-medium text-slate-500">Support (draft)</p>
            <p className="mt-1 font-medium">support@studentpro.example</p>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Legal / DSA notices (draft)</p>
            <p className="mt-1 font-medium">legal@studentpro.example</p>
          </div>
          <p className="text-sm text-slate-600">
            Do not send enrollment documents by email unless a secure process specifically asks for
            them. Use in-product verification and reporting flows whenever possible.
          </p>
        </div>
        <Button variant="outline" render={<Link href="/legal/impressum" />}>Impressum</Button>
      </div>
    </PublicShell>
  );
}
