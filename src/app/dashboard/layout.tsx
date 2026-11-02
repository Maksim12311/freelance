import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { SiteHeader } from "@/components/layout/site-header";
import { isVerificationActive, requireVerifiedStudent } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireVerifiedStudent("/dashboard");
  const verified = isVerificationActive(profile) || profile.is_admin;

  return (
    <>
      <SiteHeader
        user={{
          id: profile.id,
          displayName: profile.display_name,
          isAdmin: profile.is_admin,
          verified,
        }}
      />
      <div className="mx-auto flex w-full max-w-6xl flex-1 gap-2 px-2 sm:px-4">
        <DashboardSidebar />
        <div className="min-w-0 flex-1 px-2 py-8 sm:px-4">{children}</div>
      </div>
    </>
  );
}
