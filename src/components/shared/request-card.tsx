import Link from "next/link";
import { MapPin, Euro, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
    <Link
      href={`/requests/${request.id}`}
      className="group flex h-full flex-col rounded-[1.5rem] border border-slate-200/90 bg-white p-5 transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_24px_48px_-32px_rgba(37,99,235,0.45)]"
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {request.category ? (
          <Badge variant="secondary" className="rounded-md bg-blue-50 text-[#1d4ed8]">
            {request.category.name}
          </Badge>
        ) : null}
        <Badge variant="outline" className="rounded-md capitalize">
          {request.status.replace("_", " ")}
        </Badge>
        {request.owner?.verification_status === "verified" ? <VerifiedBadge compact /> : null}
      </div>
      <h3 className="font-heading text-lg font-semibold leading-snug text-slate-900 transition group-hover:text-[#2563EB]">
        {request.title}
      </h3>
      <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-600">
        {truncate(request.description, 140)}
      </p>
      <div className="mt-5 flex flex-wrap gap-3 border-t border-slate-100 pt-4 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1">
          <Euro className="h-3.5 w-3.5" />
          {request.suggested_budget_eur != null
            ? formatBudget(request.suggested_budget_eur)
            : "Budget open"}
        </span>
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
    </Link>
  );
}
