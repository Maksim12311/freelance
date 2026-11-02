"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Search,
  FilePlus2,
  FileText,
  Send,
  MessageSquare,
  Users,
  BarChart3,
  UserRound,
  Shield,
  Inbox,
  Sparkles,
} from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { cn } from "@/lib/utils";

type Mode = "customer" | "specialist";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  match?: "exact" | "prefix";
};

const customerNav: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard, match: "exact" },
  { href: "/requests/new", label: "Post request", icon: FilePlus2, match: "exact" },
  { href: "/dashboard/requests", label: "My requests", icon: FileText },
  { href: "/students", label: "Find specialists", icon: Users },
  { href: "/messages", label: "Messages", icon: MessageSquare },
];

const specialistNav: NavItem[] = [
  { href: "/dashboard/specialist", label: "Home", icon: LayoutDashboard, match: "exact" },
  { href: "/requests", label: "Browse jobs", icon: Search },
  { href: "/dashboard/applications", label: "My applications", icon: Send },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/messages", label: "Messages", icon: MessageSquare },
];

function isActive(pathname: string, href: string, match: "exact" | "prefix" = "prefix") {
  if (href === "/requests/new") return pathname === "/requests/new";
  if (href === "/requests") {
    return (
      pathname === "/requests" ||
      (pathname.startsWith("/requests/") && !pathname.startsWith("/requests/new"))
    );
  }
  if (href === "/dashboard") return pathname === "/dashboard";
  if (href === "/dashboard/specialist") {
    return pathname === "/dashboard/specialist";
  }
  if (match === "exact") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition duration-200",
        active
          ? "bg-[#fff0f2] text-[#be123c] shadow-sm ring-1 ring-[#f0d5db]"
          : "text-[#6f5f64] hover:bg-[#fff5f6] hover:text-[#2a2124]",
      )}
    >
      <Icon className={cn("h-4 w-4 shrink-0", active ? "text-[#e11d48]" : "opacity-70")} />
      <span className="truncate">{label}</span>
    </Link>
  );
}

export function AppSidebar({
  userName,
  isAdmin,
  activeMode = "customer",
}: {
  userName: string;
  isAdmin?: boolean;
  activeMode?: Mode;
}) {
  const pathname = usePathname();
  const items = activeMode === "specialist" ? specialistNav : customerNav;

  return (
    <aside className="hidden w-[15.5rem] shrink-0 md:block">
      <div className="sticky top-0 flex h-dvh flex-col border-r border-[#f0d5db] bg-white/95 px-3 py-4 backdrop-blur">
        <Link
          href={activeMode === "specialist" ? "/dashboard/specialist" : "/dashboard"}
          className="mb-4 px-2 transition hover:opacity-90"
        >
          <Logo />
        </Link>

        <div
          className={cn(
            "mb-4 rounded-2xl px-3 py-2.5 text-xs font-medium",
            activeMode === "specialist"
              ? "bg-[#fff0f2] text-[#be123c]"
              : "bg-[#fff8f9] text-[#6f5f64]",
          )}
        >
          <p className="flex items-center gap-1.5">
            {activeMode === "specialist" ? (
              <Sparkles className="h-3.5 w-3.5" />
            ) : (
              <Inbox className="h-3.5 w-3.5" />
            )}
            {activeMode === "specialist" ? "Specialist menu" : "Customer menu"}
          </p>
        </div>

        <nav className="min-h-0 flex-1 space-y-5 overflow-y-auto pb-4">
          <div className="space-y-0.5">
            {items.map((item) => (
              <NavLink
                key={item.href + item.label}
                href={item.href}
                label={item.label}
                icon={item.icon}
                active={isActive(pathname, item.href, item.match)}
              />
            ))}
          </div>

          <div>
            <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9f1239]/65">
              Account
            </p>
            <div className="space-y-0.5">
              <NavLink
                href="/settings"
                label="Profile & settings"
                icon={UserRound}
                active={pathname.startsWith("/settings")}
              />
              {isAdmin ? (
                <NavLink
                  href="/admin"
                  label="Admin"
                  icon={Shield}
                  active={pathname.startsWith("/admin")}
                />
              ) : null}
            </div>
          </div>
        </nav>

        <div className="mt-auto rounded-2xl border border-[#f0d5db] bg-[#fff8f9] px-3 py-3">
          <p className="truncate text-sm font-medium text-[#2a2124]">{userName}</p>
          <p className="mt-0.5 text-xs capitalize text-[#6f5f64]">
            {activeMode} · Vienna
          </p>
          <Link
            href="/settings"
            className="mt-2 inline-flex text-xs font-medium text-[#be123c] hover:underline"
          >
            Manage account
          </Link>
        </div>
      </div>
    </aside>
  );
}

export function AppMobileTabs({ activeMode = "customer" }: { activeMode?: Mode }) {
  const pathname = usePathname();
  const tabs =
    activeMode === "specialist"
      ? [
          { href: "/dashboard/specialist", label: "Home", icon: LayoutDashboard },
          { href: "/requests", label: "Jobs", icon: Search },
          { href: "/dashboard/applications", label: "Apps", icon: Send },
          { href: "/messages", label: "Chat", icon: MessageSquare },
          { href: "/settings", label: "You", icon: UserRound },
        ]
      : [
          { href: "/dashboard", label: "Home", icon: LayoutDashboard },
          { href: "/requests/new", label: "Post", icon: FilePlus2 },
          { href: "/dashboard/requests", label: "Mine", icon: FileText },
          { href: "/messages", label: "Chat", icon: MessageSquare },
          { href: "/settings", label: "You", icon: UserRound },
        ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[#f0d5db] bg-white/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1.5 backdrop-blur md:hidden">
      <div className="mx-auto grid max-w-lg grid-cols-5 gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = isActive(
            pathname,
            tab.href,
            tab.href === "/dashboard" ||
              tab.href === "/requests/new" ||
              tab.href === "/dashboard/specialist"
              ? "exact"
              : "prefix",
          );
          return (
            <Link
              key={tab.href + tab.label}
              href={tab.href}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-xl px-1 py-1.5 text-[10px] font-medium",
                active ? "text-[#e11d48]" : "text-[#6f5f64]",
              )}
            >
              <Icon className={cn("h-5 w-5", active ? "text-[#e11d48]" : "opacity-70")} />
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
