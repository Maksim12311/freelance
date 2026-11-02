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
      className="block rounded-2xl bg-white p-5 shadow-[0_14px_30px_-24px_rgba(37,99,235,0.55)] ring-1 ring-[#dbe7f5] transition hover:-translate-y-0.5 hover:ring-[#93c5fd]"
    >
      <div className="flex flex-wrap items-center gap-2 text-xs">
        {request.category ? (
          <span className="rounded-md bg-[#eaf2ff] px-2 py-1 font-medium text-[#1e3a8a]">
            {request.category.name}
          </span>
        ) : null}
        <span className="capitalize text-slate-500">{request.status.replace("_", " ")}</span>
        {request.owner?.verification_status === "verified" ? (
          <span className="font-medium text-[#0f766e]">Verified</span>
        ) : null}
      </div>
      <h3 className="mt-3 font-heading text-lg font-semibold text-slate-900">{request.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">
        {truncate(request.description, 120)}
      </p>
      <p className="mt-4 text-xs text-slate-500">
        {request.suggested_budget_eur != null
          ? formatBudget(request.suggested_budget_eur)
          : "Budget open"}
        {request.location ? ` · ${request.location}` : ""}
        {` · ${formatRelativeDate(request.created_at)}`}
      </p>
    </Link>
  );
}
