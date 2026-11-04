"use client";

import { useActionState } from "react";
import { submitApplicationAction } from "@/lib/actions/applications";
import type { ActionResult } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

function Result({ state }: { state: ActionResult | null }) {
  if (!state?.error && !state?.message) return null;
  const ok = state.ok && !state.error;
  return (
    <p
      className={`rounded-xl border px-3 py-2 text-sm ${
        ok
          ? "border-green-200 bg-green-50 text-green-700"
          : "border-red-200 bg-red-50 text-red-700"
      }`}
    >
      {state.error || state.message}
    </p>
  );
}

export function PaidApplicationForm({
  requestId,
  feeFormatted,
  feeEnabled,
  credits,
}: {
  requestId: string;
  feeFormatted: string;
  feeEnabled: boolean;
  credits: number;
}) {
  const [state, action, pending] = useActionState(submitApplicationAction, null);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="requestId" value={requestId} />
      <Result state={state} />

      {feeEnabled ? (
        <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-950">
          <p className="font-medium">Application fee: {feeFormatted}</p>
          <p className="text-xs text-amber-900">
            Charged once per request. Messaging unlocks after payment
            {credits > 0
              ? ` · You have ${credits} application credit${credits === 1 ? "" : "s"}`
              : ""}
            . Plus does not waive this fee.
          </p>
          <p className="text-xs text-amber-900">
            <strong>No reply → credit back:</strong> No customer message / accept / decline within
            72 hours → 1 credit returned (never twice). Viewing does not count. Statutory monetary
            refund rights are separate.
          </p>
          <label className="flex items-start gap-2 text-xs">
            <input type="checkbox" name="acceptFeePolicy" required className="mt-0.5 size-4 rounded border" />
            <span>I understand the fee and 72-hour credit-back policy.</span>
          </label>
        </div>
      ) : (
        <p className="text-xs text-slate-500">
          Paid applications are disabled pending legal approval. Free apply is available.
        </p>
      )}

      <div className="space-y-2">
        <Label htmlFor="introduction">Short introduction</Label>
        <Textarea id="introduction" name="introduction" required minLength={20} rows={4} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="experience">Relevant experience</Label>
        <Textarea id="experience" name="experience" rows={3} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="proposedPriceEur">Optional proposed price (€)</Label>
          <Input id="proposedPriceEur" name="proposedPriceEur" type="number" min={0} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="availability">Availability</Label>
          <Input id="availability" name="availability" />
        </div>
      </div>
      <Button type="submit" disabled={pending}>
        {pending
          ? "Processing…"
          : feeEnabled
            ? `Pay ${feeFormatted} & apply`
            : "Send Application"}
      </Button>
    </form>
  );
}
