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
        "z-40 backdrop-blur-xl",
        hero
          ? "absolute inset-x-0 top-0 border-b border-[#0b1220]/08 bg-[#f7fbff]/55"
          : "sticky top-0 border-b border-[#d7e3ef] bg-[#f7fbff]/85",
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-8">
          <Link href="/" className="group flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2563EB] font-heading text-sm font-bold text-white transition duration-300 group-hover:rotate-6">
              S
            </span>
            <span className="font-heading text-lg font-semibold tracking-tight text-[#0b1220]">
              StudentPro
            </span>
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-[#5b6b7c] transition hover:text-[#0b1220]"
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
                Dashboard
              </Button>
              <Button size="sm" className="rounded-xl" render={<Link href="/requests/new" />}>
                Post a Request
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" render={<Link href="/login" />}>
                Login
              </Button>
              <Button size="sm" className="rounded-xl" render={<Link href="/signup" />}>
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
