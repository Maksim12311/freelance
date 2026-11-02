import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-[#edd9cb] bg-stone-950 text-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-14 sm:px-6 md:flex-row md:justify-between">
        <div className="max-w-sm space-y-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#e11d48] font-heading text-sm font-bold text-white">
              S
            </span>
            <p className="font-heading text-lg font-semibold tracking-tight">StudentPro</p>
          </div>
          <p className="text-sm leading-relaxed text-white/65">
            Students helping students in Vienna. We only connect people — we do not take payments
            for services.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-10 text-sm">
          <div className="space-y-3">
            <p className="font-semibold text-white">Site</p>
            <Link href="/how-it-works" className="block text-white/65 transition hover:text-white">
              How it works
            </Link>
            <Link href="/safety" className="block text-white/65 transition hover:text-white">
              Safety
            </Link>
            <Link href="/contact" className="block text-white/65 transition hover:text-white">
              Contact
            </Link>
          </div>
          <div className="space-y-3">
            <p className="font-semibold text-white">Legal</p>
            <Link href="/legal/terms" className="block text-white/65 transition hover:text-white">
              Terms
            </Link>
            <Link href="/legal/privacy" className="block text-white/65 transition hover:text-white">
              Privacy
            </Link>
            <Link href="/legal/impressum" className="block text-white/65 transition hover:text-white">
              Impressum
            </Link>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex w-full max-w-6xl px-4 py-4 text-xs text-white/45 sm:px-6">
          © 2026 StudentPro · Vienna
        </div>
      </div>
    </footer>
  );
}
