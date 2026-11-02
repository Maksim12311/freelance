import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireVerifiedStudent } from "@/lib/auth";
import { getSpecialistAnalytics } from "@/lib/analytics";
import { hasActivePlus } from "@/lib/payments";
import { formatRelativeDate } from "@/lib/utils";

export const metadata = { title: "Specialist analytics" };

export default async function AnalyticsPage() {
  const profile = await requireVerifiedStudent("/dashboard/analytics");
  const plus = await hasActivePlus(profile.id);
  const analytics = await getSpecialistAnalytics(profile.id);

  if (!plus) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Analytics</h1>
          <p className="mt-2 text-slate-600">
            Advanced profile analytics are included with StudentPro Plus.
          </p>
        </div>
        <Card>
          <CardContent className="space-y-4 pt-6">
            <p className="text-sm text-slate-600">
              Subscribe to Plus for profile views, invitation stats, conversion rates, and category
              demand. Applications remain charged separately.
            </p>
            <Button render={<Link href="/dashboard/specialist" />}>Go to Specialist mode</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats = [
    { label: "Profile views", value: analytics.profileViews },
    { label: "Search impressions", value: analytics.searchImpressions },
    { label: "Invitations received", value: analytics.invitationsReceived },
    { label: "Applications sent", value: analytics.applicationsSent },
    { label: "Applications accepted", value: analytics.applicationsAccepted },
    { label: "Collaborations confirmed", value: analytics.collaborationsConfirmed },
    { label: "Boost impressions", value: analytics.boostImpressions },
    {
      label: "Application conversion",
      value:
        analytics.applicationConversionRate != null
          ? `${analytics.applicationConversionRate}%`
          : "—",
    },
    {
      label: "Selection conversion",
      value:
        analytics.selectionConversionRate != null
          ? `${analytics.selectionConversionRate}%`
          : "—",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Specialist analytics</h1>
          <p className="mt-2 text-slate-600">
            Metrics from real database events only — no fabricated impressions.
          </p>
        </div>
        <Badge variant="secondary">StudentPro Plus</Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">{stat.label}</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">{stat.value}</CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Category demand</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {analytics.categoryDemand.length ? (
              analytics.categoryDemand.map((row) => (
                <div
                  key={row.categoryId}
                  className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-sm"
                >
                  <span>{row.name}</span>
                  <span className="font-medium">{row.openRequests} open</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No open request demand data yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent events</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {analytics.recentEvents.length ? (
              analytics.recentEvents.map((event) => (
                <div
                  key={event.id}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                >
                  <p className="font-medium">{event.event_type.replaceAll("_", " ")}</p>
                  <p className="text-xs text-slate-500">{formatRelativeDate(event.created_at)}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No events recorded yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
