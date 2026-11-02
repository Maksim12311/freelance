import { PublicShell } from "@/components/layout/public-shell";
import { ForgotPasswordForm } from "@/components/forms/auth-forms";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Forgot Password" };

export default function ForgotPasswordPage() {
  return (
    <PublicShell forceMarketing>
      <div className="mx-auto w-full max-w-md px-4 py-12 sm:px-6">
        <Card>
          <CardHeader>
            <CardTitle>Reset password</CardTitle>
            <CardDescription>
              We will email a secure link if an account exists for that address.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ForgotPasswordForm />
          </CardContent>
        </Card>
      </div>
    </PublicShell>
  );
}
