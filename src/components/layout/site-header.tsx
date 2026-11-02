import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SiteMobileNav } from "@/components/layout/site-mobile-nav";
import { Logo } from "@/components/shared/logo";
import { PUBLIC_NAV_LINKS, VERIFIED_NAV_LINKS } from "@/lib/constants";

type SiteHeaderProps = {
  user?: {
    id: string;
    displayName: string;
    isAdmin?: boolean;
    verified?: boolean;
  } | null;
  tone?: "light" | "hero";
};

export function SiteHeader({ user }: SiteHeaderProps) {
  const verified = Boolean(user?.verified);
  const nav = verified
    ? VERIFIED_NAV_LINKS.map((l) => ({ href: l.href, label: l.label }))
    : PUBLIC_NAV_LINKS.map((l) => ({ href: l.href, label: l.label }));

  return (
    <header className="sticky top-0 z-40 border-b border-[#f0d5db]/80 bg-[#fff5f6]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-7">
          <Link href="/" className="transition hover:opacity-90">
            <Logo priority />
          </Link>
          <nav className="hidden items-center gap-5 md:flex">
            {nav.map((item) => (
              <Link
                key={`${item.href}-${item.label}`}
                href={item.href}
                className="text-sm font-medium text-[#6f5f64] transition hover:text-[#e11d48]"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            verified ? (
              user.isAdmin ? (
                <Button variant="ghost" size="sm" render={<Link href="/admin" />}>
                  Admin
                </Button>
              ) : null
            ) : (
              <Button
                size="sm"
                className="rounded-xl bg-[#e11d48] hover:bg-[#be123c]"
                render={<Link href="/verify-student" />}
              >
                Complete verification
              </Button>
            )
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="text-[#6f5f64] hover:text-[#e11d48]"
                render={<Link href="/login" />}
              >
                Log In
              </Button>
              <Button
                size="sm"
                className="rounded-xl bg-[#e11d48] hover:bg-[#be123c]"
                render={<Link href="/signup" />}
              >
                Join Now
              </Button>
            </>
          )}
        </div>

        <SiteMobileNav user={user} links={nav} verified={verified} />
      </div>
    </header>
  );
}
