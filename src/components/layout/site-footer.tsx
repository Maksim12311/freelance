import Link from "next/link";

const footerLinks = [
  { href: "/about", label: "About" },
  { href: "/safety", label: "Safety" },
  { href: "/legal/terms", label: "Terms" },
  { href: "/legal/privacy", label: "Privacy" },
  { href: "/legal/impressum", label: "Impressum" },
  { href: "/contact", label: "Contact" },
];

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-[#edd9cb] bg-stone-950 text-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-14 sm:px-6 md:flex-row md:items-start md:justify-between">
        <div className="max-w-sm space-y-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#e11d48] font-heading text-sm font-bold text-white">
              S
            </span>
            <p className="font-heading text-lg font-semibold tracking-tight">StudentPro</p>
          </div>
          <p className="text-sm leading-relaxed text-white/65">
            A private marketplace for verified university students in Vienna. We only connect
            people — we do not take payments for services.
          </p>
        </div>
        <nav className="grid grid-cols-2 gap-x-10 gap-y-3 text-sm sm:grid-cols-3">
          {footerLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-white/65 transition hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex w-full max-w-6xl px-4 py-4 text-xs text-white/45 sm:px-6">
          © 2026 StudentPro · Vienna
        </div>
      </div>
    </footer>
  );
}
