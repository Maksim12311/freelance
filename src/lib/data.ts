import { createClient } from "@/lib/supabase/server";
import type { Category, Profile, RequestRow, University } from "@/types/database";

export function hasSupabaseEnv() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

/** Matches `supabase/seed.sql` so signup works before/without a live DB. */
export const FALLBACK_UNIVERSITIES: University[] = [
  {
    id: "11111111-1111-4111-8111-111111111101",
    name: "University of Vienna",
    short_name: "Uni Wien",
    city: "Vienna",
    country: "AT",
    is_active: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "11111111-1111-4111-8111-111111111102",
    name: "Vienna University of Economics and Business",
    short_name: "WU",
    city: "Vienna",
    country: "AT",
    is_active: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "11111111-1111-4111-8111-111111111103",
    name: "TU Wien",
    short_name: "TU Wien",
    city: "Vienna",
    country: "AT",
    is_active: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "11111111-1111-4111-8111-111111111104",
    name: "Modul University Vienna",
    short_name: "Modul",
    city: "Vienna",
    country: "AT",
    is_active: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "11111111-1111-4111-8111-111111111105",
    name: "Medical University of Vienna",
    short_name: "MedUni",
    city: "Vienna",
    country: "AT",
    is_active: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "11111111-1111-4111-8111-111111111106",
    name: "University of Applied Arts Vienna",
    short_name: "Die Angewandte",
    city: "Vienna",
    country: "AT",
    is_active: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "11111111-1111-4111-8111-111111111107",
    name: "Academy of Fine Arts Vienna",
    short_name: "Akademie",
    city: "Vienna",
    country: "AT",
    is_active: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "11111111-1111-4111-8111-111111111108",
    name: "FH Technikum Wien",
    short_name: "Technikum",
    city: "Vienna",
    country: "AT",
    is_active: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "11111111-1111-4111-8111-111111111109",
    name: "FH Campus Wien",
    short_name: "FH Campus",
    city: "Vienna",
    country: "AT",
    is_active: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "11111111-1111-4111-8111-111111111110",
    name: "Other accredited university",
    short_name: "Other",
    city: "Vienna",
    country: "AT",
    is_active: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
];

export async function getUniversities(): Promise<University[]> {
  if (!hasSupabaseEnv()) return FALLBACK_UNIVERSITIES;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("universities")
      .select("*")
      .eq("is_active", true)
      .order("name");
    if (error || !data?.length) return FALLBACK_UNIVERSITIES;
    return data as University[];
  } catch {
    return FALLBACK_UNIVERSITIES;
  }
}

export async function getCategories(): Promise<Category[]> {
  if (!hasSupabaseEnv()) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");
  return (data as Category[]) ?? [];
}

export async function getRecentRequests(limit = 6) {
  if (!hasSupabaseEnv()) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("requests")
    .select(
      "id, title, description, suggested_budget_eur, location, work_mode, status, created_at, category:categories(name, slug), owner:profiles!requests_owner_id_fkey(display_name, verification_status)",
    )
    .eq("is_hidden", false)
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function getFeaturedStudents(limit = 6) {
  if (!hasSupabaseEnv()) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select(
      "id, display_name, bio, avatar_url, general_location, average_rating, completed_collaborations_count, verification_status, university:universities(name, short_name)",
    )
    .eq("verification_status", "verified")
    .eq("privacy_show_in_directory", true)
    .eq("is_suspended", false)
    .order("average_rating", { ascending: false, nullsFirst: false })
    .limit(limit);
  return data ?? [];
}

export type RequestListItem = RequestRow & {
  category?: { name: string; slug: string } | null;
  owner?: { display_name: string; verification_status: string } | null;
};

export async function getProfileById(id: string): Promise<Profile | null> {
  if (!hasSupabaseEnv()) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
  return (data as Profile | null) ?? null;
}
