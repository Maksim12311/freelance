import Link from "next/link";
import { PublicShell } from "@/components/layout/public-shell";
import { SignupForm } from "@/components/forms/auth-forms";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getUniversities } from "@/lib/data";

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

  return (
    <PublicShell>
      <div className="mx-auto flex w-full max-w-lg flex-col px-4 py-12 sm:px-6">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-2xl">Join StudentPro</CardTitle>
            <CardDescription>
              Create your account, then verify your student status to access the private
              marketplace.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
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
