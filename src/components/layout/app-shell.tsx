import Link from "next/link";
import { AppMobileTabs, AppSidebar } from "@/components/layout/app-sidebar";
import { ModeSwitcher } from "@/components/shared/mode-switcher";
import { Logo } from "@/components/shared/logo";

type AppShellProps = {
  children: React.ReactNode;
  user: {
    id: string;
    displayName: string;
    firstName?: string;
    isAdmin?: boolean;
    verified?: boolean;
    activeMode?: "customer" | "specialist";
  };
};

/**
 * Persistent marketplace chrome with mode-specific left menu.
 */
export function AppShell({ children, user }: AppShellProps) {
  const mode = user.activeMode ?? "customer";

  return (
    <div className="flex min-h-full flex-1">
      <AppSidebar userName={user.displayName} isAdmin={user.isAdmin} activeMode={mode} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-[#f0d5db]/80 bg-[#fff5f6]/90 backdrop-blur-xl md:bg-white/75">
          <div className="flex h-14 items-center justify-between gap-3 px-4 sm:px-6">
            <Link
              href={mode === "specialist" ? "/dashboard/specialist" : "/dashboard"}
              className="md:hidden"
            >
              <Logo />
            </Link>
            <p className="hidden text-sm text-[#6f5f64] md:block">
              {mode === "specialist"
                ? "You’re offering skills"
                : "You’re looking for help"}
            </p>
            <div className="ml-auto flex items-center gap-3">
              <ModeSwitcher activeMode={mode} />
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 pb-24 sm:px-6 sm:py-8 md:pb-8">
          {children}
        </main>

        <AppMobileTabs activeMode={mode} />
      </div>
    </div>
  );
}
