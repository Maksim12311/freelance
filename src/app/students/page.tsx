import { PublicShell } from "@/components/layout/public-shell";
import { StudentCard } from "@/components/shared/student-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requireVerifiedStudent } from "@/lib/auth";
import { getUniversities, hasSupabaseEnv } from "@/lib/data";
import { DEMO_STUDENTS, isDemoMode } from "@/lib/demo";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Find Students" };

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requireVerifiedStudent("/students");
  const params = await searchParams;
  const universities = await getUniversities();
  let students: Array<Record<string, unknown>> = [];

  if (isDemoMode() || !hasSupabaseEnv()) {
    let rows = [...DEMO_STUDENTS];
    if (params.q) {
      const q = params.q.toLowerCase();
      rows = rows.filter(
        (s) =>
          s.display_name.toLowerCase().includes(q) ||
          (s.bio || "").toLowerCase().includes(q),
      );
    }
    if (params.location) {
      rows = rows.filter((s) =>
        (s.general_location || "").toLowerCase().includes(params.location!.toLowerCase()),
      );
    }
    students = rows as Array<Record<string, unknown>>;
  } else {
    const supabase = await createClient();
    let query = supabase
      .from("profiles")
      .select(
        "id, display_name, bio, avatar_url, general_location, average_rating, completed_collaborations_count, verification_status, university:universities(name, short_name), profile_skills(skill:skills(name))",
      )
      .eq("verification_status", "verified")
      .eq("privacy_show_in_directory", true)
      .eq("is_suspended", false)
      .order("display_name");

    if (params.q) {
      query = query.or(`display_name.ilike.%${params.q}%,bio.ilike.%${params.q}%`);
    }
    if (params.university) query = query.eq("university_id", params.university);
    if (params.location) query = query.ilike("general_location", `%${params.location}%`);

    const { data } = await query.limit(48);
    students = (data as Array<Record<string, unknown>>) ?? [];
  }

  return (
    <PublicShell>
      <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-10 sm:px-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Find students</h1>
          <p className="mt-2 text-slate-600">
            Directory of verified students. Unverified profiles are never shown as verified.
          </p>
        </div>

        <form className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-4">
          <Input name="q" placeholder="Name or bio" defaultValue={params.q} />
          <select
            name="university"
            defaultValue={params.university || ""}
            className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm"
          >
            <option value="">All universities</option>
            {universities.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
          <Input name="location" placeholder="Location" defaultValue={params.location} />
          <Button type="submit">Search</Button>
        </form>

        {students.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {students.map((student) => {
              const skillsRaw = student.profile_skills as
                | Array<{ skill: { name: string } | { name: string }[] | null }>
                | undefined;
              const skills =
                skillsRaw
                  ?.map((row) => (Array.isArray(row.skill) ? row.skill[0] : row.skill))
                  .filter(Boolean)
                  .map((s) => ({ name: (s as { name: string }).name })) ?? [];
              return (
                <StudentCard
                  key={String(student.id)}
                  student={{
                    id: String(student.id),
                    display_name: String(student.display_name),
                    bio: (student.bio as string | null) ?? null,
                    avatar_url: (student.avatar_url as string | null) ?? null,
                    general_location: (student.general_location as string | null) ?? null,
                    average_rating: (student.average_rating as number | null) ?? null,
                    completed_collaborations_count: Number(
                      student.completed_collaborations_count ?? 0,
                    ),
                    verification_status: String(student.verification_status),
                    university: Array.isArray(student.university)
                      ? (student.university[0] as {
                          name: string;
                          short_name: string | null;
                        })
                      : (student.university as {
                          name: string;
                          short_name: string | null;
                        } | null),
                    skills,
                  }}
                />
              );
            })}
          </div>
        ) : (
          <EmptyState
            title="No verified students found"
            description="Try another search or check back after more students verify."
          />
        )}
      </div>
    </PublicShell>
  );
}
