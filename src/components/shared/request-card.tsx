import Link from "next/link";
import { MapPin, Euro, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VerifiedBadge } from "@/components/shared/verified-badge";
import { formatBudget, formatRelativeDate, truncate } from "@/lib/utils";

export type RequestCardData = {
  id: string;
  title: string;
  description: string;
  suggested_budget_eur: number | null;
  location: string | null;
  work_mode: string;
  status: string;
  created_at: string;
  category?: { name: string; slug: string } | null;
  owner?: {
    display_name: string;
    verification_status: string;
  } | null;
};

export function RequestCard({ request }: { request: RequestCardData }) {
  return (
    <Link href={`/requests/${request.id}`} className="group block h-full">
      <Card className="h-full border-slate-200/80 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800">
        <CardHeader className="space-y-3 pb-3">
          <div className="flex flex-wrap items-center gap-2">
            {request.category ? (
              <Badge variant="secondary">{request.category.name}</Badge>
            ) : null}
            <Badge variant="outline" className="capitalize">
              {request.status.replace("_", " ")}
            </Badge>
            {request.owner?.verification_status === "verified" ? (
              <VerifiedBadge compact />
            ) : null}
          </div>
          <CardTitle className="text-lg leading-snug transition group-hover:text-[#2563EB]">
            {request.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            {truncate(request.description, 140)}
          </p>
          <div className="flex flex-wrap gap-3 text-xs text-slate-500">
            {request.suggested_budget_eur != null ? (
              <span className="inline-flex items-center gap-1">
                <Euro className="h-3.5 w-3.5" />
                {formatBudget(request.suggested_budget_eur)}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1">
                <Euro className="h-3.5 w-3.5" />
                Budget open
              </span>
            )}
            {request.location ? (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {request.location}
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1 capitalize">
              {request.work_mode.replace("_", " ")}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {formatRelativeDate(request.created_at)}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
