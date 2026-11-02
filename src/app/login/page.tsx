import Link from "next/link";
import { PublicShell } from "@/components/layout/public-shell";
import { LoginForm } from "@/components/forms/auth-forms";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Login" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;

  return (
    <PublicShell>
      <div className="mx-auto flex w-full max-w-md flex-col px-4 py-12 sm:px-6">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-2xl">Welcome back</CardTitle>
            <CardDescription>Sign in to your StudentPro account.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {params.error === "suspended" ? (
              <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                This account is suspended. Contact support if you believe this is a mistake.
              </p>
            ) : null}
            <LoginForm nextPath={params.next} />
            <p className="text-center text-sm text-slate-600">
              New here?{" "}
              <Link
                href={
                  params.next
                    ? `/signup?next=${encodeURIComponent(params.next)}`
                    : "/signup"
                }
                className="font-medium text-[#2563EB]"
              >
                Sign up
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </PublicShell>
  );
}
