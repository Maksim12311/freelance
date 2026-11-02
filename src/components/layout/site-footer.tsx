import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-slate-50">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:justify-between">
        <div className="max-w-sm space-y-2">
          <p className="font-heading text-base font-bold">StudentPro</p>
          <p className="text-sm text-slate-600">
            Students helping students in Vienna. We only connect people — we do not take payments
            for services.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-8 text-sm">
          <div className="space-y-2">
            <p className="font-medium text-slate-900">Site</p>
            <Link href="/how-it-works" className="block text-slate-600 hover:text-slate-900">
              How it works
            </Link>
            <Link href="/safety" className="block text-slate-600 hover:text-slate-900">
              Safety
            </Link>
            <Link href="/contact" className="block text-slate-600 hover:text-slate-900">
              Contact
            </Link>
          </div>
          <div className="space-y-2">
            <p className="font-medium text-slate-900">Legal</p>
            <Link href="/legal/terms" className="block text-slate-600 hover:text-slate-900">
              Terms
            </Link>
            <Link href="/legal/privacy" className="block text-slate-600 hover:text-slate-900">
              Privacy
            </Link>
            <Link href="/legal/impressum" className="block text-slate-600 hover:text-slate-900">
              Impressum
            </Link>
          </div>
        </div>
      </div>
      <div className="border-t border-slate-200">
        <div className="mx-auto flex w-full max-w-5xl px-4 py-4 text-xs text-slate-500 sm:px-6">
          © 2026 StudentPro · Vienna
        </div>
      </div>
    </footer>
  );
}
