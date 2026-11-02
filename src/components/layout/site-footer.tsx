import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-[#dbe7f5] bg-white">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10 sm:px-6 md:flex-row md:justify-between">
        <div className="max-w-sm space-y-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#2563EB] font-heading text-sm font-bold text-white">
              S
            </span>
            <p className="font-heading text-base font-semibold">StudentPro</p>
          </div>
          <p className="text-sm leading-relaxed text-slate-600">
            Students helping students in Vienna. We only connect people — we do not take payments
            for services.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-8 text-sm">
          <div className="space-y-2">
            <p className="font-semibold text-slate-900">Site</p>
            <Link href="/how-it-works" className="block text-slate-600 hover:text-[#2563EB]">
              How it works
            </Link>
            <Link href="/safety" className="block text-slate-600 hover:text-[#2563EB]">
              Safety
            </Link>
            <Link href="/contact" className="block text-slate-600 hover:text-[#2563EB]">
              Contact
            </Link>
          </div>
          <div className="space-y-2">
            <p className="font-semibold text-slate-900">Legal</p>
            <Link href="/legal/terms" className="block text-slate-600 hover:text-[#2563EB]">
              Terms
            </Link>
            <Link href="/legal/privacy" className="block text-slate-600 hover:text-[#2563EB]">
              Privacy
            </Link>
            <Link href="/legal/impressum" className="block text-slate-600 hover:text-[#2563EB]">
              Impressum
            </Link>
          </div>
        </div>
      </div>
      <div className="border-t border-[#dbe7f5] bg-[#f7faff]">
        <div className="mx-auto flex w-full max-w-5xl px-4 py-4 text-xs text-slate-500 sm:px-6">
          © 2026 StudentPro · Vienna
        </div>
      </div>
    </footer>
  );
}
