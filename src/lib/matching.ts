import type { WorkMode } from "@/types/database";

export type MatchReason = {
  code:
    | "category"
    | "skills"
    | "location"
    | "remote"
    | "budget"
    | "schedule"
    | "profile"
    | "boost"
    | "plus";
  label: string;
  weight: number;
};

export type MatchCandidateProfile = {
  id: string;
  display_name: string;
  bio: string | null;
  specialist_headline: string | null;
  specialist_bio: string | null;
  general_location: string | null;
  availability: string | null;
  preferred_budget_min_eur: number | null;
  preferred_budget_max_eur: number | null;
  remote_available: boolean;
  average_rating: number | null;
  completed_collaborations_count: number;
  skillIds: string[];
  categoryIds: string[];
  hasActiveBoost: boolean;
  hasActivePlus: boolean;
};

export type MatchRequest = {
  id: string;
  owner_id: string;
  category_id: string;
  title: string;
  description: string;
  suggested_budget_eur: number | null;
  location: string | null;
  work_mode: WorkMode;
  preferred_date: string | null;
};

export type RankedMatch<T> = {
  item: T;
  score: number;
  reasons: MatchReason[];
  isSponsored: boolean;
  placement: "sponsored" | "organic";
};

const LOCATION_ALIASES = ["vienna", "wien", "at", "austria"];

function normalizeLocation(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

function locationsCompatible(a: string | null | undefined, b: string | null | undefined) {
  const left = normalizeLocation(a);
  const right = normalizeLocation(b);
  if (!left || !right) return true;
  if (left.includes(right) || right.includes(left)) return true;
  const leftVienna = LOCATION_ALIASES.some((alias) => left.includes(alias));
  const rightVienna = LOCATION_ALIASES.some((alias) => right.includes(alias));
  return leftVienna && rightVienna;
}

function remoteCompatible(workMode: WorkMode, remoteAvailable: boolean) {
  if (workMode === "remote") return remoteAvailable;
  if (workMode === "hybrid") return true;
  return true;
}

function budgetCompatible(
  requestBudget: number | null,
  min: number | null,
  max: number | null,
) {
  if (requestBudget == null) return true;
  if (min == null && max == null) return true;
  if (min != null && max != null) return requestBudget >= min && requestBudget <= max * 1.25;
  if (min != null) return requestBudget >= min * 0.75;
  if (max != null) return requestBudget <= max * 1.25;
  return true;
}

function scheduleOverlap(requestDate: string | null, availability: string | null) {
  if (!requestDate) return true;
  if (!availability || !availability.trim()) return true;
  const hay = availability.toLowerCase();
  // Soft signal only — treat any stated availability as a weak positive.
  if (hay.includes("flexible") || hay.includes("anytime") || hay.includes("week")) return true;
  return true;
}

/** Deterministic specialist↔request score. No fabricated percentages. */
export function scoreSpecialistForRequest(
  specialist: MatchCandidateProfile,
  request: MatchRequest,
): { score: number; reasons: MatchReason[]; relevant: boolean } {
  const reasons: MatchReason[] = [];
  let score = 0;

  const categoryHit = specialist.categoryIds.includes(request.category_id);
  if (categoryHit) {
    score += 40;
    reasons.push({ code: "category", label: "Matches request category", weight: 40 });
  }

  const skillHits = specialist.skillIds.length;
  if (skillHits > 0 && categoryHit) {
    const skillWeight = Math.min(25, 8 + skillHits * 3);
    score += skillWeight;
    reasons.push({
      code: "skills",
      label: `Has ${skillHits} skill${skillHits === 1 ? "" : "s"} in related areas`,
      weight: skillWeight,
    });
  }

  if (locationsCompatible(specialist.general_location, request.location)) {
    score += 15;
    reasons.push({ code: "location", label: "Location compatible", weight: 15 });
  }

  if (remoteCompatible(request.work_mode, specialist.remote_available)) {
    score += 10;
    reasons.push({
      code: "remote",
      label:
        request.work_mode === "remote"
          ? "Available for remote work"
          : "Work mode compatible",
      weight: 10,
    });
  } else if (request.work_mode === "remote" && !specialist.remote_available) {
    score -= 20;
  }

  if (
    budgetCompatible(
      request.suggested_budget_eur,
      specialist.preferred_budget_min_eur,
      specialist.preferred_budget_max_eur,
    )
  ) {
    score += 10;
    reasons.push({ code: "budget", label: "Budget range compatible", weight: 10 });
  } else {
    score -= 15;
  }

  if (scheduleOverlap(request.preferred_date, specialist.availability)) {
    score += 5;
    reasons.push({ code: "schedule", label: "Availability noted", weight: 5 });
  }

  const profileDepth =
    (specialist.specialist_headline ? 3 : 0) +
    (specialist.specialist_bio || specialist.bio ? 3 : 0) +
    (specialist.completed_collaborations_count > 0 ? 4 : 0) +
    (specialist.average_rating != null ? 2 : 0);
  if (profileDepth > 0) {
    score += profileDepth;
    reasons.push({
      code: "profile",
      label: "Complete specialist profile",
      weight: profileDepth,
    });
  }

  // Relevance gate: must share category OR (location + budget) to appear at all.
  const relevant =
    categoryHit ||
    (locationsCompatible(specialist.general_location, request.location) &&
      budgetCompatible(
        request.suggested_budget_eur,
        specialist.preferred_budget_min_eur,
        specialist.preferred_budget_max_eur,
      ) &&
      specialist.skillIds.length > 0);

  return { score, reasons, relevant };
}

const MAX_SPONSORED = 3;
/** Minimum organic relevance before boost/Plus can elevate placement. */
const SPONSORED_RELEVANCE_FLOOR = 40;

/**
 * Rank specialists for a request.
 * Sponsored (boost) placements are separate, limited, and still require relevance.
 * Plus adds a modest organic bump only — never overrides basic relevance.
 */
export function rankSpecialistsForRequest(
  specialists: MatchCandidateProfile[],
  request: MatchRequest,
  options?: { excludeIds?: Set<string>; limit?: number },
): RankedMatch<MatchCandidateProfile>[] {
  const exclude = options?.excludeIds ?? new Set<string>();
  const limit = options?.limit ?? 12;

  const scored = specialists
    .filter((s) => s.id !== request.owner_id && !exclude.has(s.id))
    .map((item) => {
      const { score, reasons, relevant } = scoreSpecialistForRequest(item, request);
      let organicScore = score;
      if (item.hasActivePlus && relevant) {
        organicScore += 5;
        reasons.push({
          code: "plus",
          label: "StudentPro Plus visibility",
          weight: 5,
        });
      }
      return { item, score: organicScore, reasons, relevant };
    })
    .filter((row) => row.relevant && row.score > 0)
    .sort((a, b) => b.score - a.score || a.item.id.localeCompare(b.item.id));

  const sponsored: RankedMatch<MatchCandidateProfile>[] = [];
  const organic: RankedMatch<MatchCandidateProfile>[] = [];
  const used = new Set<string>();

  for (const row of scored) {
    if (
      row.item.hasActiveBoost &&
      row.score >= SPONSORED_RELEVANCE_FLOOR &&
      sponsored.length < MAX_SPONSORED
    ) {
      sponsored.push({
        item: row.item,
        score: row.score,
        reasons: [
          ...row.reasons,
          { code: "boost", label: "Active profile boost", weight: 0 },
        ],
        isSponsored: true,
        placement: "sponsored",
      });
      used.add(row.item.id);
    }
  }

  for (const row of scored) {
    if (used.has(row.item.id)) continue;
    organic.push({
      item: row.item,
      score: row.score,
      reasons: row.reasons,
      isSponsored: false,
      placement: "organic",
    });
    used.add(row.item.id);
  }

  return [...sponsored, ...organic].slice(0, limit);
}

/**
 * Rank open requests for a specialist (recommended board).
 */
export function rankRequestsForSpecialist(
  requests: MatchRequest[],
  specialist: MatchCandidateProfile,
  options?: { excludeRequestIds?: Set<string>; limit?: number },
): RankedMatch<MatchRequest>[] {
  const exclude = options?.excludeRequestIds ?? new Set<string>();
  const limit = options?.limit ?? 20;

  return requests
    .filter((r) => r.owner_id !== specialist.id && !exclude.has(r.id))
    .map((item) => {
      const { score, reasons, relevant } = scoreSpecialistForRequest(specialist, item);
      return { item, score, reasons, relevant, isSponsored: false as const };
    })
    .filter((row) => row.relevant && row.score > 0)
    .sort((a, b) => b.score - a.score || a.item.id.localeCompare(b.item.id))
    .slice(0, limit)
    .map((row) => ({
      item: row.item,
      score: row.score,
      reasons: row.reasons,
      isSponsored: false,
      placement: "organic" as const,
    }));
}
