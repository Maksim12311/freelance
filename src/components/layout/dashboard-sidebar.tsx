"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Search,
  FileText,
  Send,
  MessageSquare,
  UserRound,
  Settings,
  Briefcase,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/requests", label: "Browse requests", icon: Search },
  { href: "/dashboard/requests", label: "My requests", icon: FileText },
  { href: "/dashboard/applications", label: "Applications", icon: Send },
  { href: "/dashboard/specialist", label: "Specialist", icon: Briefcase },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/messages", label: "Messages", icon: MessageSquare },
  { href: "/settings", label: "Profile", icon: UserRound },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-56 shrink-0 p-4 md:block">
      <div className="sticky top-24 rounded-3xl border border-[#f0d5db] bg-white/80 p-3 shadow-[0_18px_40px_-32px_rgba(225,29,72,0.35)] backdrop-blur">
        <p className="px-3 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9f1239]/70">
          Workspace
        </p>
        <nav className="space-y-0.5">
          {items.map((item) => {
            const Icon = item.icon;
            const active =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={`${item.href}-${item.label}`}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition duration-300",
                  active
                    ? "bg-[#fff0f2] text-[#be123c] shadow-sm ring-1 ring-[#f0d5db]"
                    : "text-[#6f5f64] hover:bg-[#fff5f6] hover:text-[#2a2124]",
                )}
              >
                <Icon className={cn("h-4 w-4", active ? "text-[#e11d48]" : "opacity-70")} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
