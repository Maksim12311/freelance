"use server";

import { createClient } from "@/lib/supabase/server";

export type AnalyticsEventType =
  | "profile_view"
  | "search_impression"
  | "invitation_received"
  | "invitation_sent"
  | "application_sent"
  | "application_accepted"
  | "collaboration_confirmed"
  | "boost_impression"
  | "boost_purchase"
  | "plus_subscribe"
  | "request_alert";

export async function trackAnalyticsEvent(input: {
  eventType: AnalyticsEventType;
  actorId?: string | null;
  subjectProfileId?: string | null;
  requestId?: string | null;
  applicationId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  try {
    const supabase = await createClient();
    await supabase.from("analytics_events").insert({
      event_type: input.eventType,
      actor_id: input.actorId ?? null,
      subject_profile_id: input.subjectProfileId ?? null,
      request_id: input.requestId ?? null,
      application_id: input.applicationId ?? null,
      metadata: input.metadata ?? {},
    });
  } catch {
    // Analytics must never break core flows.
  }
}

export type SpecialistAnalyticsSummary = {
  profileViews: number;
  searchImpressions: number;
  invitationsReceived: number;
  applicationsSent: number;
  applicationsAccepted: number;
  collaborationsConfirmed: number;
  boostImpressions: number;
  selectionConversionRate: number | null;
  applicationConversionRate: number | null;
  categoryDemand: Array<{ categoryId: string; name: string; openRequests: number }>;
  recentEvents: Array<{
    id: string;
    event_type: string;
    created_at: string;
    metadata: Record<string, unknown>;
  }>;
};

export async function getSpecialistAnalytics(
  profileId: string,
): Promise<SpecialistAnalyticsSummary> {
  const empty: SpecialistAnalyticsSummary = {
    profileViews: 0,
    searchImpressions: 0,
    invitationsReceived: 0,
    applicationsSent: 0,
    applicationsAccepted: 0,
    collaborationsConfirmed: 0,
    boostImpressions: 0,
    selectionConversionRate: null,
    applicationConversionRate: null,
    categoryDemand: [],
    recentEvents: [],
  };

  try {
    const supabase = await createClient();
    const { data: events } = await supabase
      .from("analytics_events")
      .select("id, event_type, created_at, metadata")
      .eq("subject_profile_id", profileId)
      .order("created_at", { ascending: false })
      .limit(500);

    const rows = events ?? [];
    const count = (type: string) => rows.filter((e) => e.event_type === type).length;

    const profileViews = count("profile_view");
    const searchImpressions = count("search_impression");
    const invitationsReceived = count("invitation_received");
    const applicationsSent = count("application_sent");
    const applicationsAccepted = count("application_accepted");
    const collaborationsConfirmed = count("collaboration_confirmed");
    const boostImpressions = count("boost_impression");

    const applicationConversionRate =
      applicationsSent > 0
        ? Math.round((applicationsAccepted / applicationsSent) * 1000) / 10
        : null;
    const selectionConversionRate =
      invitationsReceived + applicationsSent > 0
        ? Math.round(
            (collaborationsConfirmed / (invitationsReceived + applicationsSent)) * 1000,
          ) / 10
        : null;

    // Category demand from open requests (aggregate, not PII).
    const { data: openRequests } = await supabase
      .from("requests")
      .select("category_id, category:categories(id, name)")
      .eq("status", "open")
      .eq("is_hidden", false);

    const demandMap = new Map<string, { name: string; openRequests: number }>();
    for (const row of openRequests ?? []) {
      const cat = Array.isArray(row.category) ? row.category[0] : row.category;
      const id = row.category_id as string;
      const name = cat?.name ?? "Other";
      const prev = demandMap.get(id) ?? { name, openRequests: 0 };
      prev.openRequests += 1;
      demandMap.set(id, prev);
    }

    const categoryDemand = [...demandMap.entries()]
      .map(([categoryId, v]) => ({ categoryId, name: v.name, openRequests: v.openRequests }))
      .sort((a, b) => b.openRequests - a.openRequests)
      .slice(0, 8);

    return {
      profileViews,
      searchImpressions,
      invitationsReceived,
      applicationsSent,
      applicationsAccepted,
      collaborationsConfirmed,
      boostImpressions,
      selectionConversionRate,
      applicationConversionRate,
      categoryDemand,
      recentEvents: rows.slice(0, 20).map((e) => ({
        id: e.id,
        event_type: e.event_type,
        created_at: e.created_at,
        metadata: (e.metadata ?? {}) as Record<string, unknown>,
      })),
    };
  } catch {
    return empty;
  }
}
