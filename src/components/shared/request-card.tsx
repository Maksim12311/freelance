import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
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
      className="group relative flex h-full flex-col overflow-hidden rounded-[1.35rem] bg-white p-6 ring-1 ring-[#edd9cb] transition duration-400 hover:-translate-y-1 hover:shadow-[0_28px_50px_-30px_rgba(225,29,72,0.45)] hover:ring-rose-200"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-gradient-to-r from-[#e11d48] to-[#0284c7] transition duration-500 group-hover:scale-x-100" />

      <div className="flex flex-wrap items-center gap-2 text-xs">
        {request.category ? (
          <span className="rounded-lg bg-[#ffe4d6] px-2.5 py-1 font-semibold text-[#9a3412]">
            {request.category.name}
          </span>
        ) : null}
        <span className="capitalize text-stone-500">{request.status.replace("_", " ")}</span>
        {request.owner?.verification_status === "verified" ? (
          <span className="font-semibold text-[#0284c7]">Verified</span>
        ) : null}
      </div>

      <h3 className="mt-4 font-heading text-xl font-semibold tracking-tight text-stone-900 transition group-hover:text-[#e11d48]">
        {request.title}
      </h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-stone-600">
        {truncate(request.description, 120)}
      </p>

      <div className="mt-6 flex items-end justify-between gap-3 border-t border-[#edd9cb]/70 pt-4">
        <p className="text-xs leading-relaxed text-stone-500">
          {request.suggested_budget_eur != null
            ? formatBudget(request.suggested_budget_eur)
            : "Budget open"}
          {request.location ? ` · ${request.location}` : ""}
          {` · ${formatRelativeDate(request.created_at)}`}
        </p>
        <ArrowUpRight className="h-4 w-4 shrink-0 text-stone-300 transition group-hover:text-[#e11d48]" />
      </div>
    </Link>
  );
}
