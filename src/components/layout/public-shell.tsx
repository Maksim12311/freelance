import { AppShell } from "@/components/layout/app-shell";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { getCurrentProfile, isVerificationActive } from "@/lib/auth";

export async function PublicShell({
  children,
  tone = "light",
  forceMarketing = false,
}: {
  children: React.ReactNode;
  tone?: "light" | "hero";
  /** Keep classic header/footer even if logged in (landing, legal, auth). */
  forceMarketing?: boolean;
}) {
  const profile = await getCurrentProfile();
  const verified = profile ? isVerificationActive(profile) || profile.is_admin : false;

  // Verified students get the permanent app menu — not the marketing top nav.
  if (profile && verified && !forceMarketing) {
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

  return (
    <>
      <SiteHeader
        tone={tone}
        user={
          profile
            ? {
                id: profile.id,
                displayName: profile.display_name,
                isAdmin: profile.is_admin,
                verified,
              }
            : null
        }
      />
      <div className="flex-1">{children}</div>
      <SiteFooter />
    </>
  );
}
