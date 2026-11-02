import Link from "next/link";
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
      className="block rounded-xl border border-slate-200 bg-white p-4 hover:border-slate-300 hover:bg-slate-50"
    >
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
        {request.category ? <span>{request.category.name}</span> : null}
        <span className="capitalize">{request.status.replace("_", " ")}</span>
        {request.owner?.verification_status === "verified" ? (
          <span className="text-[#2563EB]">Verified student</span>
        ) : null}
      </div>
      <h3 className="mt-2 font-medium text-slate-900">{request.title}</h3>
      <p className="mt-2 text-sm text-slate-600">{truncate(request.description, 120)}</p>
      <p className="mt-3 text-xs text-slate-500">
        {request.suggested_budget_eur != null
          ? formatBudget(request.suggested_budget_eur)
          : "Budget open"}
        {request.location ? ` · ${request.location}` : ""}
        {` · ${formatRelativeDate(request.created_at)}`}
      </p>
    </Link>
  );
}
