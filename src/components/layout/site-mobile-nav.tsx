"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type SiteMobileNavProps = {
  user?: { id: string; displayName: string; isAdmin?: boolean } | null;
  links: { href: string; label: string }[];
};

export function SiteMobileNav({ user, links }: SiteMobileNavProps) {
  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button
            variant="outline"
            size="icon"
            className="md:hidden"
            aria-label="Open menu"
          />
        }
      >
        <Menu className="h-4 w-4" />
      </SheetTrigger>
      <SheetContent side="right" className="w-[280px]">
        <SheetHeader>
          <SheetTitle>StudentPro</SheetTitle>
        </SheetHeader>
        <nav className="mt-6 flex flex-col gap-3">
          {links.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {item.label}
            </Link>
          ))}
          <div className="my-2 h-px bg-border" />
          {user ? (
            <>
              <Link href="/dashboard" className="rounded-lg px-3 py-2 text-sm font-medium">
                Dashboard
              </Link>
              <Link href="/messages" className="rounded-lg px-3 py-2 text-sm font-medium">
                Messages
              </Link>
              <Link href="/requests/new" className="rounded-lg px-3 py-2 text-sm font-medium">
                Post a Request
              </Link>
              {user.isAdmin ? (
                <Link href="/admin" className="rounded-lg px-3 py-2 text-sm font-medium">
                  Admin
                </Link>
              ) : null}
            </>
          ) : (
            <>
              <Link href="/login" className="rounded-lg px-3 py-2 text-sm font-medium">
                Login
              </Link>
              <Link href="/signup" className="rounded-lg px-3 py-2 text-sm font-medium">
                Sign Up
              </Link>
            </>
          )}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
