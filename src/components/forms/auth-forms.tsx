"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  forgotPasswordAction,
  loginAction,
  resetPasswordAction,
  signupAction,
  type ActionResult,
} from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function FormError({ state }: { state: ActionResult | null }) {
  if (!state?.error) return null;
  return (
    <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
      {state.error}
    </p>
  );
}

function FormSuccess({ state }: { state: ActionResult | null }) {
  if (!state?.ok || !state.message) return null;
  return (
    <p className="rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
      {state.message}
    </p>
  );
}

export function SignupForm({
  universities,
  nextPath,
}: {
  universities: { id: string; name: string }[];
  nextPath?: string;
}) {
  const [state, action, pending] = useActionState(signupAction, null);

  return (
    <form action={action} className="space-y-4">
      <FormError state={state} />
      <input type="hidden" name="next" value={nextPath || "/dashboard"} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="firstName">First name</Label>
          <Input id="firstName" name="firstName" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last name</Label>
          <Input id="lastName" name="lastName" required />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" name="password" type="password" required minLength={8} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            minLength={8}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="universityId">University</Label>
        <select
          id="universityId"
          name="universityId"
          required
          defaultValue=""
          className="flex h-11 w-full rounded-xl border border-[#f0d5db] bg-white px-3 text-sm text-[#2a2124] outline-none focus-visible:border-[#e11d48] focus-visible:ring-3 focus-visible:ring-[#e11d48]/25 dark:bg-card"
        >
          <option value="" disabled>
            Select university
          </option>
          {universities.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
      </div>
      <label className="flex items-start gap-2 text-sm text-slate-600">
        <input
          type="checkbox"
          name="acceptTerms"
          value="true"
          required
          className="mt-0.5 size-4 rounded border border-input"
        />
        <span>
          I agree to the{" "}
          <Link href="/legal/terms" className="text-[#e11d48] underline">
            Terms of Service
          </Link>
          .
        </span>
      </label>
      <label className="flex items-start gap-2 text-sm text-slate-600">
        <input
          type="checkbox"
          name="acceptPrivacy"
          value="true"
          required
          className="mt-0.5 size-4 rounded border border-input"
        />
        <span>
          I acknowledge the{" "}
          <Link href="/legal/privacy" className="text-[#e11d48] underline">
            Privacy Policy
          </Link>
          .
        </span>
      </label>
      <Button
        type="submit"
        className="w-full rounded-xl bg-[#e11d48] hover:bg-[#be123c]"
        disabled={pending}
      >
        {pending ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}

export function LoginForm({ nextPath }: { nextPath?: string }) {
  const [state, action, pending] = useActionState(loginAction, null);
  return (
    <form action={action} className="space-y-4">
      <FormError state={state} />
      <input type="hidden" name="next" value={nextPath || "/dashboard"} />
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" required />
      </div>
      <div className="flex justify-end">
        <Link href="/forgot-password" className="text-sm text-[#2563EB]">
          Forgot password?
        </Link>
      </div>
      <Button type="submit" className="w-full bg-[#2563EB] hover:bg-blue-700" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(forgotPasswordAction, null);
  return (
    <form action={action} className="space-y-4">
      <FormError state={state} />
      <FormSuccess state={state} />
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required />
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Sending…" : "Send reset link"}
      </Button>
    </form>
  );
}

export function ResetPasswordForm() {
  const [state, action, pending] = useActionState(resetPasswordAction, null);
  return (
    <form action={action} className="space-y-4">
      <FormError state={state} />
      <div className="space-y-2">
        <Label htmlFor="password">New password</Label>
        <Input id="password" name="password" type="password" required minLength={8} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm password</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          minLength={8}
        />
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Updating…" : "Update password"}
      </Button>
    </form>
  );
}
