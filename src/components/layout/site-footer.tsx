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
    <footer className="mt-auto border-t border-border bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#2563EB] text-sm font-bold text-white">
              S
            </span>
            <span className="text-lg font-semibold">StudentPro</span>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            Students Helping Students. A Vienna marketplace that connects university
            students — StudentPro does not employ students or process service payments.
          </p>
          <p className="text-xs text-slate-500">
            Draft legal pages require review by a qualified Austrian legal professional
            before public launch.
          </p>
        </div>
        {footerLinks.map((group) => (
          <div key={group.title}>
            <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
              {group.title}
            </h3>
            <ul className="space-y-2">
              {group.items.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-slate-600 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span>© 2026 StudentPro (draft operator entity).</span>
          <span>Vienna, Austria · EUR (€)</span>
        </div>
      </div>
    </footer>
  );
}
