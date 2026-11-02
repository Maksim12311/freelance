import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SiteMobileNav } from "@/components/layout/site-mobile-nav";

const nav = [
  { href: "/requests", label: "Find help" },
  { href: "/students", label: "Find students" },
  { href: "/how-it-works", label: "How it works" },
];

type SiteHeaderProps = {
  user?: { id: string; displayName: string; isAdmin?: boolean } | null;
  tone?: "light" | "hero";
};

export function SiteHeader({ user }: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-[#dbe7f5]/80 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-7">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#2563EB] font-heading text-sm font-bold text-white shadow-[0_8px_20px_-10px_rgba(37,99,235,0.9)]">
              S
            </span>
            <span className="font-heading text-lg font-semibold text-slate-900">StudentPro</span>
          </Link>
          <nav className="hidden items-center gap-5 md:flex">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-slate-600 transition hover:text-[#2563EB]"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <>
              {user.isAdmin ? (
                <Button variant="ghost" size="sm" render={<Link href="/admin" />}>
                  Admin
                </Button>
              ) : null}
              <Button variant="ghost" size="sm" render={<Link href="/dashboard" />}>
                My account
              </Button>
              <Button size="sm" className="rounded-xl" render={<Link href="/requests/new" />}>
                Ask for help
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" render={<Link href="/login" />}>
                Log in
              </Button>
              <Button size="sm" className="rounded-xl" render={<Link href="/signup" />}>
                Sign up
              </Button>
            </>
          )}
        </div>

        <SiteMobileNav user={user} links={nav} />
      </div>
    </header>
  );
}
