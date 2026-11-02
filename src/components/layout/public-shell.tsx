import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { getCurrentProfile, isVerificationActive } from "@/lib/auth";

export async function PublicShell({
  children,
  tone = "light",
}: {
  children: React.ReactNode;
  tone?: "light" | "hero";
}) {
  const profile = await getCurrentProfile();
  const verified = profile ? isVerificationActive(profile) || profile.is_admin : false;

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
