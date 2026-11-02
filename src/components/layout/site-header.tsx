import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SiteMobileNav } from "@/components/layout/site-mobile-nav";
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
    <header className="sticky top-0 z-40 border-b border-[#edd9cb]/80 bg-[#fff8f3]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-7">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#e11d48] font-heading text-sm font-bold text-white shadow-[0_8px_20px_-10px_rgba(225,29,72,0.95)]">
              S
            </span>
            <span className="font-heading text-lg font-semibold tracking-tight text-stone-900">
              StudentPro
            </span>
          </Link>
          <nav className="hidden items-center gap-5 md:flex">
            {nav.map((item) => (
              <Link
                key={`${item.href}-${item.label}`}
                href={item.href}
                className="text-sm font-medium text-stone-600 transition hover:text-[#e11d48]"
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
                className="rounded-xl bg-[#e11d48] hover:bg-rose-700"
                render={<Link href="/verify-student" />}
              >
                Complete verification
              </Button>
            )
          ) : (
            <>
              <Button variant="ghost" size="sm" render={<Link href="/login" />}>
                Log In
              </Button>
              <Button
                size="sm"
                className="rounded-xl bg-[#e11d48] hover:bg-rose-700"
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
