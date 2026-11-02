import Link from "next/link";
import { PublicShell } from "@/components/layout/public-shell";
import { RequestCard } from "@/components/shared/request-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getCategories, hasSupabaseEnv } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Find Requests" };

export default async function RequestsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page || 1));
  const pageSize = 12;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const categories = await getCategories();
  let requests: Array<Record<string, unknown>> = [];
  let count = 0;

  if (hasSupabaseEnv()) {
    const supabase = await createClient();
    let query = supabase
      .from("requests")
      .select(
        "id, title, description, suggested_budget_eur, location, work_mode, status, created_at, category:categories(name, slug), owner:profiles!requests_owner_id_fkey(display_name, verification_status)",
        { count: "exact" },
      )
      .eq("is_hidden", false);

    if (params.status === "open" || params.status === "in_progress" || params.status === "closed") {
      query = query.eq("status", params.status);
    } else {
      query = query.in("status", ["open", "in_progress"]);
    }

    if (params.q) query = query.or(`title.ilike.%${params.q}%,description.ilike.%${params.q}%`);
    if (params.location) query = query.ilike("location", `%${params.location}%`);
    if (
      params.workMode === "remote" ||
      params.workMode === "in_person" ||
      params.workMode === "hybrid"
    ) {
      query = query.eq("work_mode", params.workMode);
    }
    if (params.budgetMin) query = query.gte("suggested_budget_eur", Number(params.budgetMin));
    if (params.budgetMax) query = query.lte("suggested_budget_eur", Number(params.budgetMax));
    if (params.category) {
      const category = categories.find((c) => c.slug === params.category);
      if (category) query = query.eq("category_id", category.id);
    }

    const sort = params.sort || "newest";
    if (sort === "oldest") query = query.order("created_at", { ascending: true });
    else if (sort === "budget_asc")
      query = query.order("suggested_budget_eur", { ascending: true, nullsFirst: false });
    else if (sort === "budget_desc")
      query = query.order("suggested_budget_eur", { ascending: false, nullsFirst: false });
    else query = query.order("created_at", { ascending: false });

    const { data, count: total } = await query.range(from, to);
    requests = (data as Array<Record<string, unknown>>) ?? [];
    count = total ?? 0;
  }

  const totalPages = Math.max(1, Math.ceil(count / pageSize));

  return (
    <PublicShell>
      <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-10 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Find requests</h1>
            <p className="mt-2 text-slate-600">
              Browse student help requests across Vienna. Private details and applications require
              verification.
            </p>
          </div>
          <Button className="bg-[#2563EB] hover:bg-blue-700" render={<Link href="/requests/new" />}>Post a Request</Button>
        </div>

        <form className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-6">
          <Input name="q" placeholder="Search" defaultValue={params.q} className="md:col-span-2" />
          <select
            name="category"
            defaultValue={params.category || ""}
            className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
          <Input name="location" placeholder="Location" defaultValue={params.location} />
          <select
            name="workMode"
            defaultValue={params.workMode || ""}
            className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm"
          >
            <option value="">Remote / In person</option>
            <option value="remote">Remote</option>
            <option value="in_person">In person</option>
            <option value="hybrid">Hybrid</option>
          </select>
          <select
            name="sort"
            defaultValue={params.sort || "newest"}
            className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="budget_asc">Budget low to high</option>
            <option value="budget_desc">Budget high to low</option>
          </select>
          <div className="grid grid-cols-2 gap-2 md:col-span-2">
            <Input name="budgetMin" type="number" placeholder="Min €" defaultValue={params.budgetMin} />
            <Input name="budgetMax" type="number" placeholder="Max €" defaultValue={params.budgetMax} />
          </div>
          <select
            name="status"
            defaultValue={params.status || ""}
            className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm"
          >
            <option value="">Open + in progress</option>
            <option value="open">Open</option>
            <option value="in_progress">In progress</option>
            <option value="closed">Closed</option>
          </select>
          <Button type="submit" className="md:col-span-2">
            Apply filters
          </Button>
        </form>

        {requests.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {requests.map((request) => (
              <RequestCard
                key={String(request.id)}
                request={{
                  id: String(request.id),
                  title: String(request.title),
                  description: String(request.description),
                  suggested_budget_eur: (request.suggested_budget_eur as number | null) ?? null,
                  location: (request.location as string | null) ?? null,
                  work_mode: String(request.work_mode),
                  status: String(request.status),
                  created_at: String(request.created_at),
                  category: Array.isArray(request.category)
                    ? (request.category[0] as { name: string; slug: string })
                    : (request.category as { name: string; slug: string } | null),
                  owner: Array.isArray(request.owner)
                    ? (request.owner[0] as {
                        display_name: string;
                        verification_status: string;
                      })
                    : (request.owner as {
                        display_name: string;
                        verification_status: string;
                      } | null),
                }}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No requests found"
            description={
              hasSupabaseEnv()
                ? "Try adjusting filters or post the first request."
                : "Configure Supabase credentials to load marketplace data."
            }
            action={
              <Button render={<Link href="/requests/new" />}>Post a Request</Button>
            }
          />
        )}

        {totalPages > 1 ? (
          <div className="flex items-center justify-center gap-3">
            {page > 1 ? (
              <Button variant="outline" render={<Link href={`/requests?page=${page - 1}`} />}>Previous</Button>
            ) : null}
            <span className="text-sm text-slate-500">
              Page {page} of {totalPages}
            </span>
            {page < totalPages ? (
              <Button variant="outline" render={<Link href={`/requests?page=${page + 1}`} />}>Next</Button>
            ) : null}
          </div>
        ) : null}
      </div>
    </PublicShell>
  );
}
