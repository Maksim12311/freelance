import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { SiteHeader } from "@/components/layout/site-header";
import { requireProfile } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireProfile("/dashboard");

  return (
    <>
      <SiteHeader
        user={{
          id: profile.id,
          displayName: profile.display_name,
          isAdmin: profile.is_admin,
        }}
      />
      <div className="mx-auto flex w-full max-w-6xl flex-1">
        <DashboardSidebar />
        <div className="min-w-0 flex-1 px-4 py-8 sm:px-6">{children}</div>
      </div>
    </>
  );
}
