import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { getCurrentProfile } from "@/lib/auth";

export async function PublicShell({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();
  return (
    <>
      <SiteHeader
        user={
          profile
            ? {
                id: profile.id,
                displayName: profile.display_name,
                isAdmin: profile.is_admin,
              }
            : null
        }
      />
      <div className="flex-1">{children}</div>
      <SiteFooter />
    </>
  );
}
