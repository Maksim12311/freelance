import { createClient } from "@/lib/supabase/server";
import {
  rankRequestsForSpecialist,
  rankSpecialistsForRequest,
  type MatchCandidateProfile,
  type MatchRequest,
  type RankedMatch,
} from "@/lib/matching";
import { expireStaleBoosts } from "@/lib/payments";
import { trackAnalyticsEvent } from "@/lib/analytics";

function unwrapSkillRows(
  rows:
    | Array<{ skill_id?: string; skill?: { id: string; category_id: string | null } | Array<{ id: string; category_id: string | null }> | null }>
    | null
    | undefined,
) {
  const skillIds: string[] = [];
  const categoryIds = new Set<string>();
  for (const row of rows ?? []) {
    const skill = Array.isArray(row.skill) ? row.skill[0] : row.skill;
    if (skill?.id) {
      skillIds.push(skill.id);
      if (skill.category_id) categoryIds.add(skill.category_id);
    } else if (row.skill_id) {
      skillIds.push(row.skill_id);
    }
  }
  return { skillIds, categoryIds: [...categoryIds] };
}

async function loadBoostAndPlusSets(profileIds: string[]) {
  const boostSet = new Set<string>();
  const plusSet = new Set<string>();
  if (!profileIds.length) return { boostSet, plusSet };

  const supabase = await createClient();
  const now = new Date().toISOString();

  const [{ data: boosts }, { data: subs }] = await Promise.all([
    supabase
      .from("profile_boosts")
      .select("profile_id")
      .in("profile_id", profileIds)
      .eq("status", "active")
      .lte("starts_at", now)
      .gt("ends_at", now),
    supabase
      .from("user_subscriptions")
      .select("profile_id")
      .in("profile_id", profileIds)
      .in("status", ["trialing", "active"])
      .gt("current_period_end", now),
  ]);

  for (const b of boosts ?? []) boostSet.add(b.profile_id);
  for (const s of subs ?? []) plusSet.add(s.profile_id);
  return { boostSet, plusSet };
}

export async function getSuggestedSpecialistsForRequest(
  requestId: string,
  options?: { actorId?: string; limit?: number },
): Promise<RankedMatch<MatchCandidateProfile>[]> {
  await expireStaleBoosts();
  const supabase = await createClient();

  const { data: request } = await supabase
    .from("requests")
    .select(
      "id, owner_id, category_id, title, description, suggested_budget_eur, location, work_mode, preferred_date",
    )
    .eq("id", requestId)
    .maybeSingle();

  if (!request) return [];

  const matchRequest = request as MatchRequest;

  const { data: profiles } = await supabase
    .from("profiles")
    .select(
      "id, display_name, bio, specialist_headline, specialist_bio, general_location, availability, preferred_budget_min_eur, preferred_budget_max_eur, remote_available, average_rating, completed_collaborations_count, profile_skills(skill_id, skill:skills(id, category_id))",
    )
    .eq("is_specialist_enabled", true)
    .eq("verification_status", "verified")
    .eq("is_suspended", false)
    .limit(100);

  const ids = (profiles ?? []).map((p) => p.id);
  const { boostSet, plusSet } = await loadBoostAndPlusSets(ids);

  const candidates: MatchCandidateProfile[] = (profiles ?? []).map((p) => {
    const { skillIds, categoryIds } = unwrapSkillRows(
      p.profile_skills as Parameters<typeof unwrapSkillRows>[0],
    );
    return {
      id: p.id,
      display_name: p.display_name,
      bio: p.bio,
      specialist_headline: p.specialist_headline,
      specialist_bio: p.specialist_bio,
      general_location: p.general_location,
      availability: p.availability,
      preferred_budget_min_eur: p.preferred_budget_min_eur != null ? Number(p.preferred_budget_min_eur) : null,
      preferred_budget_max_eur: p.preferred_budget_max_eur != null ? Number(p.preferred_budget_max_eur) : null,
      remote_available: p.remote_available ?? true,
      average_rating: p.average_rating != null ? Number(p.average_rating) : null,
      completed_collaborations_count: p.completed_collaborations_count ?? 0,
      skillIds,
      categoryIds,
      hasActiveBoost: boostSet.has(p.id),
      hasActivePlus: plusSet.has(p.id),
    };
  });

  const ranked = rankSpecialistsForRequest(candidates, matchRequest, {
    limit: options?.limit ?? 12,
  });

  // Persist match scores (best-effort) + impression events
  for (const row of ranked) {
    await supabase.from("specialist_match_scores").upsert(
      {
        request_id: requestId,
        specialist_id: row.item.id,
        score: row.score,
        reasons: row.reasons,
        is_sponsored: row.isSponsored,
        computed_at: new Date().toISOString(),
      },
      { onConflict: "request_id,specialist_id" },
    );

    await trackAnalyticsEvent({
      eventType: row.isSponsored ? "boost_impression" : "search_impression",
      actorId: options?.actorId ?? null,
      subjectProfileId: row.item.id,
      requestId,
      metadata: { score: row.score, placement: row.placement },
    });
  }

  return ranked;
}

export async function getRecommendedRequestsForSpecialist(
  specialistId: string,
  options?: { limit?: number },
): Promise<RankedMatch<MatchRequest & { category_name?: string | null }>[]> {
  await expireStaleBoosts();
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "id, display_name, bio, specialist_headline, specialist_bio, general_location, availability, preferred_budget_min_eur, preferred_budget_max_eur, remote_available, average_rating, completed_collaborations_count, profile_skills(skill_id, skill:skills(id, category_id))",
    )
    .eq("id", specialistId)
    .maybeSingle();

  if (!profile) return [];

  const { boostSet, plusSet } = await loadBoostAndPlusSets([specialistId]);
  const { skillIds, categoryIds } = unwrapSkillRows(
    profile.profile_skills as Parameters<typeof unwrapSkillRows>[0],
  );

  const specialist: MatchCandidateProfile = {
    id: profile.id,
    display_name: profile.display_name,
    bio: profile.bio,
    specialist_headline: profile.specialist_headline,
    specialist_bio: profile.specialist_bio,
    general_location: profile.general_location,
    availability: profile.availability,
    preferred_budget_min_eur:
      profile.preferred_budget_min_eur != null ? Number(profile.preferred_budget_min_eur) : null,
    preferred_budget_max_eur:
      profile.preferred_budget_max_eur != null ? Number(profile.preferred_budget_max_eur) : null,
    remote_available: profile.remote_available ?? true,
    average_rating: profile.average_rating != null ? Number(profile.average_rating) : null,
    completed_collaborations_count: profile.completed_collaborations_count ?? 0,
    skillIds,
    categoryIds,
    hasActiveBoost: boostSet.has(specialistId),
    hasActivePlus: plusSet.has(specialistId),
  };

  const { data: applied } = await supabase
    .from("applications")
    .select("request_id")
    .eq("applicant_id", specialistId);

  const exclude = new Set((applied ?? []).map((a) => a.request_id));

  const { data: requests } = await supabase
    .from("requests")
    .select(
      "id, owner_id, category_id, title, description, suggested_budget_eur, location, work_mode, preferred_date, category:categories(name)",
    )
    .eq("status", "open")
    .eq("is_hidden", false)
    .order("created_at", { ascending: false })
    .limit(80);

  const matchRequests: MatchRequest[] = (requests ?? []).map((r) => ({
    id: r.id,
    owner_id: r.owner_id,
    category_id: r.category_id,
    title: r.title,
    description: r.description,
    suggested_budget_eur:
      r.suggested_budget_eur != null ? Number(r.suggested_budget_eur) : null,
    location: r.location,
    work_mode: r.work_mode,
    preferred_date: r.preferred_date,
  }));

  const ranked = rankRequestsForSpecialist(matchRequests, specialist, {
    excludeRequestIds: exclude,
    limit: options?.limit ?? 20,
  });

  const catName = new Map(
    (requests ?? []).map((r) => {
      const cat = Array.isArray(r.category) ? r.category[0] : r.category;
      return [r.id, cat?.name ?? null] as const;
    }),
  );

  return ranked.map((row) => ({
    ...row,
    item: { ...row.item, category_name: catName.get(row.item.id) ?? null },
  }));
}
