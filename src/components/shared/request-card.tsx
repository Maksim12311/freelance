import Link from "next/link";
import { MapPin, Euro, Clock } from "lucide-react";
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
      className="group flex h-full flex-col rounded-2xl border border-[#d7e3ef] bg-white p-5 transition duration-300 hover:-translate-y-0.5 hover:border-[#2563EB]/35 hover:bg-[#f7fbff]"
    >
      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs">
        {request.category ? (
          <span className="font-medium tracking-wide text-[#2563EB] uppercase">
            {request.category.name}
          </span>
        ) : null}
        <span className="text-[#5b6b7c] capitalize">{request.status.replace("_", " ")}</span>
        {request.owner?.verification_status === "verified" ? <VerifiedBadge compact /> : null}
      </div>
      <h3 className="font-heading text-lg font-semibold leading-snug text-[#0b1220] transition group-hover:text-[#2563EB]">
        {request.title}
      </h3>
      <p className="mt-3 flex-1 text-sm leading-relaxed text-[#5b6b7c]">
        {truncate(request.description, 140)}
      </p>
      <div className="mt-5 flex flex-wrap gap-3 border-t border-[#eef5fb] pt-4 text-xs text-[#5b6b7c]">
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
