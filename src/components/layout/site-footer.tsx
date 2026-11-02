import Link from "next/link";

const footerLinks = [
  {
    title: "Product",
    items: [
      { href: "/about", label: "About" },
      { href: "/how-it-works", label: "How It Works" },
      { href: "/safety", label: "Safety" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Legal",
    items: [
      { href: "/legal/terms", label: "Terms of Service" },
      { href: "/legal/privacy", label: "Privacy Policy" },
      { href: "/legal/impressum", label: "Impressum" },
      { href: "/legal/community-guidelines", label: "Community Guidelines" },
      { href: "/legal/moderation", label: "Reporting & Moderation" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)]">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr]">
        <div className="space-y-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#2563EB] font-heading text-sm font-bold text-white">
              S
            </span>
            <span className="font-heading text-lg font-semibold tracking-tight">StudentPro</span>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-slate-600">
            Students Helping Students. A Vienna marketplace that connects university students —
            without employing them or processing service payments.
          </p>
          <p className="text-xs leading-relaxed text-slate-500">
            Draft legal pages require review by a qualified Austrian legal professional before
            public launch.
          </p>
        </div>
        {footerLinks.map((group) => (
          <div key={group.title}>
            <h3 className="mb-4 font-heading text-sm font-semibold text-slate-900">
              {group.title}
            </h3>
            <ul className="space-y-2.5">
              {group.items.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-slate-600 transition hover:text-[#2563EB]"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-slate-200/80">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span>© 2026 StudentPro (draft operator entity).</span>
          <span>Vienna, Austria · EUR (€)</span>
        </div>
      </div>
    </footer>
  );
}
