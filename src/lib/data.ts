import { createClient } from "@/lib/supabase/server";
import type { Category, Profile, RequestRow, University } from "@/types/database";

export function hasSupabaseEnv() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export async function getUniversities(): Promise<University[]> {
  if (!hasSupabaseEnv()) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("universities")
    .select("*")
    .eq("is_active", true)
    .order("name");
  return (data as University[]) ?? [];
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
