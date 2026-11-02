import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicShell } from "@/components/layout/public-shell";
import { MatchReasons } from "@/components/shared/match-reasons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { inviteSpecialistAction } from "@/lib/actions/invitations";
import { requireVerifiedStudent } from "@/lib/auth";
import { getSuggestedSpecialistsForRequest } from "@/lib/matching-data";
import { hasSupabaseEnv } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Suggested specialists" };

export default async function RequestSuggestionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await requireVerifiedStudent(`/requests/${id}/suggestions`);

  if (!hasSupabaseEnv()) {
    return (
      <PublicShell>
        <div className="mx-auto max-w-3xl px-4 py-16 text-sm text-slate-600">
          Configure Supabase to view specialist suggestions.
        </div>
      </PublicShell>
    );
  }

  const supabase = await createClient();
  const { data: request } = await supabase
    .from("requests")
    .select("id, title, owner_id, status")
    .eq("id", id)
    .maybeSingle();

  if (!request) notFound();
  if (request.owner_id !== profile.id) {
    return (
      <PublicShell>
        <div className="mx-auto max-w-3xl px-4 py-16">
          <p className="text-sm text-slate-600">Only the request owner can browse suggestions.</p>
          <Button className="mt-4" render={<Link href={`/requests/${id}`} />}>
            Back to request
          </Button>
        </div>
      </PublicShell>
    );
  }

  const suggestions = await getSuggestedSpecialistsForRequest(id, {
    actorId: profile.id,
    limit: 12,
  });

  const sponsored = suggestions.filter((s) => s.placement === "sponsored");
  const organic = suggestions.filter((s) => s.placement === "organic");

  return (
    <PublicShell>
      <div className="mx-auto w-full max-w-4xl space-y-8 px-4 py-10 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">Request published</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">Suggested specialists</h1>
            <p className="mt-2 max-w-2xl text-slate-600">
              Matched for “{request.title}” by category, skills, location, budget, and availability.
              Invite for free — specialists still pay the application fee to unlock messaging.
            </p>
          </div>
          <Button variant="outline" render={<Link href={`/requests/${id}`} />}>
            View request
          </Button>
        </div>

        {sponsored.length ? (
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Sponsored</h2>
            <p className="text-sm text-slate-500">
              Boosted profiles that still meet relevance criteria. Limited placements.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {sponsored.map((row) => (
                <SpecialistSuggestionCard
                  key={row.item.id}
                  requestId={id}
                  specialist={row.item}
                  reasons={row.reasons}
                  sponsored
                />
              ))}
            </div>
          </section>
        ) : null}

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Organic matches</h2>
          {organic.length ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {organic.map((row) => (
                <SpecialistSuggestionCard
                  key={row.item.id}
                  requestId={id}
                  specialist={row.item}
                  reasons={row.reasons}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6 text-sm text-slate-600">
                No relevant specialists yet. Share your request or check back as more students enable
                Specialist mode.
              </CardContent>
            </Card>
          )}
        </section>
      </div>
    </PublicShell>
  );
}

function SpecialistSuggestionCard({
  requestId,
  specialist,
  reasons,
  sponsored,
}: {
  requestId: string;
  specialist: {
    id: string;
    display_name: string;
    specialist_headline: string | null;
    bio: string | null;
    general_location: string | null;
  };
  reasons: import("@/lib/matching").MatchReason[];
  sponsored?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="text-base">{specialist.display_name}</CardTitle>
          {sponsored ? <Badge variant="secondary">Sponsored</Badge> : null}
        </div>
        <p className="text-sm text-slate-500">
          {specialist.specialist_headline || specialist.bio?.slice(0, 80) || "Specialist"}
          {specialist.general_location ? ` · ${specialist.general_location}` : ""}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <MatchReasons reasons={reasons} />
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" render={<Link href={`/students/${specialist.id}`} />}>
            View profile
          </Button>
          <form
            action={async () => {
              "use server";
              const fd = new FormData();
              fd.set("requestId", requestId);
              fd.set("specialistId", specialist.id);
              await inviteSpecialistAction(null, fd);
            }}
          >
            <Button type="submit" size="sm">
              Invite free
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
