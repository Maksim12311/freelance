"use client";

import { useActionState } from "react";
import {
  submitEnrollmentDocumentAction,
  submitUniversityEmailVerificationAction,
} from "@/lib/actions/verification";
import type { ActionResult } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function Result({ state }: { state: ActionResult | null }) {
  if (!state) return null;
  if (state.error) {
    return (
      <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
        {state.error}
      </p>
    );
  }
  if (state.message) {
    return (
      <p className="rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
        {state.message}
      </p>
    );
  }
  return null;
}

export function VerificationForms({ mode }: { mode: "email" | "document" }) {
  const action =
    mode === "email"
      ? submitUniversityEmailVerificationAction
      : submitEnrollmentDocumentAction;
  const [state, formAction, pending] = useActionState(action, null);

  if (mode === "email") {
    return (
      <form action={formAction} className="space-y-4">
        <Result state={state} />
        <div className="space-y-2">
          <Label htmlFor="universityEmail">University email</Label>
          <Input
            id="universityEmail"
            name="universityEmail"
            type="email"
            placeholder="name@student.tuwien.ac.at"
            required
          />
        </div>
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Submitting…" : "Submit for review"}
        </Button>
      </form>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <Result state={state} />
      <div className="space-y-2">
        <Label htmlFor="document">Enrollment document</Label>
        <Input
          id="document"
          name="document"
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
          required
        />
      </div>
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Uploading…" : "Upload securely"}
      </Button>
    </form>
  );
}
