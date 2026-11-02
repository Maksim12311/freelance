import Link from "next/link";
import { PublicShell } from "@/components/layout/public-shell";
import { SignupForm } from "@/components/forms/auth-forms";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getUniversities, hasSupabaseEnv } from "@/lib/data";

export const metadata = { title: "Sign Up" };

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const next =
    params.next && params.next.startsWith("/") && !params.next.startsWith("//")
      ? params.next
      : "/dashboard";
  const universities = await getUniversities();
  const configured = hasSupabaseEnv();

  return (
    <PublicShell>
      <div className="mx-auto flex w-full max-w-lg flex-col px-4 py-12 sm:px-6">
        <Card className="border-[#f0d5db] shadow-sm">
          <CardHeader>
            <CardTitle className="text-2xl">Join StudentPro</CardTitle>
            <CardDescription>
              Create your account, then verify your student status to access the private
              marketplace.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!configured ? (
              <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                Auth is not connected yet. You can fill the form and choose a university, but
                account creation needs Supabase keys in <code>.env.local</code>.
              </p>
            ) : null}
            <SignupForm
              universities={universities.map((u) => ({ id: u.id, name: u.name }))}
              nextPath={next}
            />
            <p className="text-center text-sm text-slate-600">
              Already have an account?{" "}
              <Link
                href={`/login?next=${encodeURIComponent(next)}`}
                className="font-medium text-[#e11d48]"
              >
                Log in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </PublicShell>
  );
}
