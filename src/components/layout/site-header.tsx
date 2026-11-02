import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SiteMobileNav } from "@/components/layout/site-mobile-nav";

const nav = [
  { href: "/requests", label: "Find Requests" },
  { href: "/students", label: "Find Students" },
  { href: "/how-it-works", label: "How It Works" },
];

type SiteHeaderProps = {
  user?: { id: string; displayName: string; isAdmin?: boolean } | null;
};

export function SiteHeader({ user }: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-white/85 backdrop-blur-md dark:bg-background/85">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-8">
          <Link href="/" className="group flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#2563EB] text-sm font-bold text-white shadow-sm transition group-hover:scale-105">
              S
            </span>
            <span className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-50">
              StudentPro
            </span>
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-slate-600 transition hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
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
                <Button variant="ghost" size="sm" render={<Link href="/admin" />}>Admin</Button>
              ) : null}
              <Button variant="ghost" size="sm" render={<Link href="/dashboard" />}>Dashboard</Button>
              <Button size="sm" render={<Link href="/requests/new" />}>Post a Request</Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" render={<Link href="/login" />}>Login</Button>
              <Button size="sm" render={<Link href="/signup" />}>Sign Up</Button>
            </>
          )}
        </div>

        <SiteMobileNav user={user} links={nav} />
      </div>
    </header>
  );
}
