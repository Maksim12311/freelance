import { PublicShell } from "@/components/layout/public-shell";
import { PlatformNotice } from "@/components/shared/platform-notice";
import { CreateRequestForm } from "@/components/forms/request-forms";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireVerifiedStudent } from "@/lib/auth";
import { getCategories } from "@/lib/data";

export const metadata = { title: "Post a Request" };

export default async function NewRequestPage() {
  await requireVerifiedStudent("/requests/new");
  const categories = await getCategories();

  return (
    <PublicShell>
      <div className="mx-auto w-full max-w-2xl space-y-6 px-4 py-10 sm:px-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Post a request</h1>
          <p className="mt-2 text-slate-600">
            Describe what you need help with. Students will apply and you arrange details directly.
          </p>
        </div>
        <PlatformNotice />
        <Card>
          <CardHeader>
            <CardTitle>Request details</CardTitle>
            <CardDescription>Suggested budgets are optional guidance, not platform prices.</CardDescription>
          </CardHeader>
          <CardContent>
            <CreateRequestForm categories={categories.map((c) => ({ id: c.id, name: c.name }))} />
          </CardContent>
        </Card>
      </div>
    </PublicShell>
  );
}
