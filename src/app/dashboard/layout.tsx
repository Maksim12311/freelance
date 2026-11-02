import { AppShell } from "@/components/layout/app-shell";
import { isVerificationActive, requireVerifiedStudent } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireVerifiedStudent("/dashboard");
  const verified = isVerificationActive(profile) || profile.is_admin;

  return (
    <AppShell
      user={{
        id: profile.id,
        displayName: profile.display_name,
        firstName: profile.first_name,
        isAdmin: profile.is_admin,
        verified,
        activeMode: profile.active_mode ?? "customer",
      }}
    >
      {children}
    </AppShell>
  );
}
