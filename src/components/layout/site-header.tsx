import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SiteMobileNav } from "@/components/layout/site-mobile-nav";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/requests", label: "Find Requests" },
  { href: "/students", label: "Find Students" },
  { href: "/how-it-works", label: "How It Works" },
];

type SiteHeaderProps = {
  user?: { id: string; displayName: string; isAdmin?: boolean } | null;
  tone?: "light" | "hero";
};

export function SiteHeader({ user, tone = "light" }: SiteHeaderProps) {
  const hero = tone === "hero";

  return (
    <header
      className={cn(
        "sticky top-0 z-40 backdrop-blur-xl",
        hero
          ? "absolute inset-x-0 border-b border-white/10 bg-slate-950/20 text-white"
          : "border-b border-slate-200/80 bg-white/80 text-slate-900",
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-8">
          <Link href="/" className="group flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#2563EB] font-heading text-sm font-bold text-white transition duration-300 group-hover:scale-105">
              S
            </span>
            <span className="font-heading text-lg font-semibold tracking-tight">StudentPro</span>
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "text-sm font-medium transition",
                  hero ? "text-white/75 hover:text-white" : "text-slate-600 hover:text-slate-950",
                )}
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
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(hero && "text-white hover:bg-white/10 hover:text-white")}
                  render={<Link href="/admin" />}
                >
                  Admin
                </Button>
              ) : null}
              <Button
                variant="ghost"
                size="sm"
                className={cn(hero && "text-white hover:bg-white/10 hover:text-white")}
                render={<Link href="/dashboard" />}
              >
                Dashboard
              </Button>
              <Button
                size="sm"
                className={cn(
                  "rounded-2xl",
                  hero && "bg-white text-slate-950 hover:bg-blue-50",
                )}
                render={<Link href="/requests/new" />}
              >
                Post a Request
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                className={cn(hero && "text-white hover:bg-white/10 hover:text-white")}
                render={<Link href="/login" />}
              >
                Login
              </Button>
              <Button
                size="sm"
                className={cn(
                  "rounded-2xl",
                  hero ? "bg-white text-slate-950 hover:bg-blue-50" : undefined,
                )}
                render={<Link href="/signup" />}
              >
                Sign Up
              </Button>
            </>
          )}
        </div>

        <SiteMobileNav user={user} links={nav} />
      </div>
    </header>
  );
}
