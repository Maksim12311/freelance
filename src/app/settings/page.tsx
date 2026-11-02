import { AppShell } from "@/components/layout/app-shell";
import { PlatformNotice } from "@/components/shared/platform-notice";
import { SettingsForms } from "@/components/forms/settings-forms";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { isVerificationActive, requireProfile } from "@/lib/auth";
import { getUniversities, hasSupabaseEnv } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const profile = await requireProfile("/settings");
  const verified = isVerificationActive(profile) || profile.is_admin;
  const universities = await getUniversities();
  let skills: { id: string; name: string }[] = [];
  let selectedSkillIds: string[] = [];
  let blocked: Array<{ blocked_id: string; profile?: { display_name: string } | null }> = [];

  if (hasSupabaseEnv()) {
    const supabase = await createClient();
    const [{ data: skillRows }, { data: profileSkills }, { data: blockedRows }] =
      await Promise.all([
        supabase.from("skills").select("id, name").eq("is_active", true).order("name"),
        supabase.from("profile_skills").select("skill_id").eq("profile_id", profile.id),
        supabase
          .from("blocked_users")
          .select("blocked_id, profile:profiles!blocked_users_blocked_id_fkey(display_name)")
          .eq("blocker_id", profile.id),
      ]);
    skills = skillRows ?? [];
    selectedSkillIds = (profileSkills ?? []).map((s) => s.skill_id);
    blocked = (blockedRows ?? []).map((row) => ({
      blocked_id: row.blocked_id,
      profile: Array.isArray(row.profile) ? row.profile[0] : row.profile,
    }));
  }

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
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-[#2a2124]">
            Settings
          </h1>
          <p className="mt-2 text-[#6f5f64]">
            Update your profile, privacy preferences, and account controls.
          </p>
        </div>
        <PlatformNotice compact />
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>
              Public profiles never show verification documents or sensitive identity data.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SettingsForms
              profile={profile}
              universities={universities.map((u) => ({ id: u.id, name: u.name }))}
              skills={skills}
              selectedSkillIds={selectedSkillIds}
              blocked={blocked}
            />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
