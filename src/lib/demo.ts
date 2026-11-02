import { cookies } from "next/headers";
import type { Category, Profile, University } from "@/types/database";

export const DEMO_COOKIE = "studentpro_demo_session";
export const DEMO_MODE_COOKIE = "studentpro_demo_mode";

export const DEMO_PROFILE_ID = "22222222-2222-4222-8222-222222222201";
export const DEMO_UNIVERSITY_ID = "11111111-1111-4111-8111-111111111101";

export function isDemoMode() {
  return !(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export const DEMO_PROFILE: Profile = {
  id: DEMO_PROFILE_ID,
  first_name: "Demo",
  last_name: "Student",
  display_name: "Demo Student",
  email: "demo@studentpro.local",
  university_id: DEMO_UNIVERSITY_ID,
  bio: "Local demo profile — no database connected. Explore the UI freely.",
  avatar_url: null,
  general_location: "Vienna",
  is_admin: true,
  is_suspended: false,
  suspension_reason: null,
  verification_status: "verified",
  verified_at: "2026-01-01T00:00:00Z",
  verification_expires_at: "2030-01-01T00:00:00Z",
  work_eligibility_status: "reviewed",
  work_eligibility_notes: null,
  availability: "Weekdays after 16:00",
  profile_completed: true,
  notification_email: true,
  notification_messages: true,
  notification_applications: true,
  privacy_show_in_directory: true,
  privacy_show_university: true,
  completed_collaborations_count: 2,
  average_rating: 4.8,
  active_mode: "customer",
  is_specialist_enabled: true,
  specialist_headline: "Tutoring & design help",
  specialist_bio: "Demo specialist profile for local previews without Supabase.",
  preferred_budget_min_eur: 20,
  preferred_budget_max_eur: 80,
  remote_available: true,
  accepts_invitations: true,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

export const FALLBACK_CATEGORIES: Category[] = [
  {
    id: "33333333-3333-4333-8333-333333333301",
    name: "Tutoring",
    slug: "tutoring",
    description: "Academic help",
    icon: null,
    sort_order: 1,
    is_active: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "33333333-3333-4333-8333-333333333302",
    name: "Design",
    slug: "design",
    description: "Graphic & UI",
    icon: null,
    sort_order: 2,
    is_active: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "33333333-3333-4333-8333-333333333303",
    name: "Tech Help",
    slug: "tech-help",
    description: "IT support",
    icon: null,
    sort_order: 3,
    is_active: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "33333333-3333-4333-8333-333333333304",
    name: "Moving",
    slug: "moving",
    description: "Local moving help",
    icon: null,
    sort_order: 4,
    is_active: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
];

export type DemoRequest = {
  id: string;
  owner_id: string;
  category_id: string;
  title: string;
  description: string;
  suggested_budget_eur: number | null;
  location: string | null;
  work_mode: "remote" | "in_person" | "hybrid";
  preferred_date: string | null;
  status: "open" | "in_progress" | "closed" | "cancelled";
  preferred_applicant_id: string | null;
  application_count: number;
  is_hidden: boolean;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
  category?: { name: string; slug: string } | null;
  owner?: { id?: string; display_name: string; verification_status: string; avatar_url?: string | null } | null;
};

export const DEMO_REQUESTS: DemoRequest[] = [
  {
    id: "44444444-4444-4444-8444-444444444401",
    owner_id: "22222222-2222-4222-8222-222222222202",
    category_id: FALLBACK_CATEGORIES[0].id,
    title: "Need calculus tutoring before midterms",
    description:
      "Looking for a patient tutor for Analysis I. Prefer two sessions this week near Uni Wien or online.",
    suggested_budget_eur: 40,
    location: "Vienna",
    work_mode: "hybrid",
    preferred_date: "2026-11-10",
    status: "open",
    preferred_applicant_id: null,
    application_count: 3,
    is_hidden: false,
    closed_at: null,
    created_at: "2026-11-01T10:00:00Z",
    updated_at: "2026-11-01T10:00:00Z",
    category: { name: "Tutoring", slug: "tutoring" },
    owner: {
      id: "22222222-2222-4222-8222-222222222202",
      display_name: "Anna K.",
      verification_status: "verified",
    },
  },
  {
    id: "44444444-4444-4444-8444-444444444402",
    owner_id: "22222222-2222-4222-8222-222222222203",
    category_id: FALLBACK_CATEGORIES[1].id,
    title: "Poster design for student association event",
    description:
      "Need a clean A2 poster for a campus open day. Brand colors and copy are ready; looking for layout and typography help.",
    suggested_budget_eur: 60,
    location: "Vienna",
    work_mode: "remote",
    preferred_date: null,
    status: "open",
    preferred_applicant_id: null,
    application_count: 1,
    is_hidden: false,
    closed_at: null,
    created_at: "2026-10-30T14:00:00Z",
    updated_at: "2026-10-30T14:00:00Z",
    category: { name: "Design", slug: "design" },
    owner: {
      id: "22222222-2222-4222-8222-222222222203",
      display_name: "Jonas M.",
      verification_status: "verified",
    },
  },
  {
    id: "44444444-4444-4444-8444-444444444403",
    owner_id: DEMO_PROFILE_ID,
    category_id: FALLBACK_CATEGORIES[3].id,
    title: "Help moving a desk across the 7th district",
    description:
      "Small furniture move on Saturday afternoon. Elevator available. Looking for one strong helper for about an hour.",
    suggested_budget_eur: 25,
    location: "Vienna · Neubau",
    work_mode: "in_person",
    preferred_date: "2026-11-08",
    status: "open",
    preferred_applicant_id: null,
    application_count: 0,
    is_hidden: false,
    closed_at: null,
    created_at: "2026-11-02T09:00:00Z",
    updated_at: "2026-11-02T09:00:00Z",
    category: { name: "Moving", slug: "moving" },
    owner: {
      id: DEMO_PROFILE_ID,
      display_name: "Demo Student",
      verification_status: "verified",
    },
  },
];

export type DemoStudent = {
  id: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  general_location: string | null;
  average_rating: number | null;
  completed_collaborations_count: number;
  verification_status: string;
  is_specialist_enabled?: boolean;
  specialist_headline?: string | null;
  university?: { name: string; short_name: string | null } | null;
  profile_skills?: Array<{ skill: { name: string } | null }>;
};

export const DEMO_STUDENTS: DemoStudent[] = [
  {
    id: DEMO_PROFILE_ID,
    display_name: "Demo Student",
    bio: "Local demo profile — no database connected.",
    avatar_url: null,
    general_location: "Vienna",
    average_rating: 4.8,
    completed_collaborations_count: 2,
    verification_status: "verified",
    is_specialist_enabled: true,
    specialist_headline: "Tutoring & design help",
    university: { name: "University of Vienna", short_name: "Uni Wien" },
    profile_skills: [{ skill: { name: "Tutoring" } }, { skill: { name: "Design" } }],
  },
  {
    id: "22222222-2222-4222-8222-222222222202",
    display_name: "Anna K.",
    bio: "Math tutoring and study planning for bachelor courses.",
    avatar_url: null,
    general_location: "Vienna",
    average_rating: 4.9,
    completed_collaborations_count: 12,
    verification_status: "verified",
    is_specialist_enabled: true,
    specialist_headline: "Analysis & algebra tutoring",
    university: { name: "TU Wien", short_name: "TU Wien" },
    profile_skills: [{ skill: { name: "Tutoring" } }],
  },
  {
    id: "22222222-2222-4222-8222-222222222203",
    display_name: "Jonas M.",
    bio: "Poster and social design for student clubs.",
    avatar_url: null,
    general_location: "Vienna",
    average_rating: 4.6,
    completed_collaborations_count: 5,
    verification_status: "verified",
    is_specialist_enabled: true,
    specialist_headline: "Campus event design",
    university: { name: "University of Applied Arts Vienna", short_name: "Die Angewandte" },
    profile_skills: [{ skill: { name: "Design" } }],
  },
];

export async function getDemoSession(): Promise<boolean> {
  if (!isDemoMode()) return false;
  try {
    const jar = await cookies();
    return jar.get(DEMO_COOKIE)?.value === "1";
  } catch {
    return false;
  }
}

export async function getDemoActiveMode(): Promise<"customer" | "specialist"> {
  try {
    const jar = await cookies();
    const value = jar.get(DEMO_MODE_COOKIE)?.value;
    return value === "specialist" ? "specialist" : "customer";
  } catch {
    return "customer";
  }
}

export async function setDemoActiveMode(mode: "customer" | "specialist") {
  const jar = await cookies();
  jar.set(DEMO_MODE_COOKIE, mode, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function getDemoProfile(): Promise<Profile | null> {
  if (!(await getDemoSession())) return null;
  const active_mode = await getDemoActiveMode();
  return {
    ...DEMO_PROFILE,
    active_mode,
    is_specialist_enabled: true,
  };
}

export function demoUniversities(): University[] {
  // Re-exported shape only — canonical list lives in lib/data.ts
  return [] as University[];
}
