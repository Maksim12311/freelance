"use client";

import { useActionState } from "react";
import { createRequestAction } from "@/lib/actions/requests";
import { submitApplicationAction } from "@/lib/actions/applications";
import { createReportAction } from "@/lib/actions/reports";
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

export function CreateRequestForm({
  categories,
}: {
  categories: { id: string; name: string }[];
}) {
  const [state, action, pending] = useActionState(createRequestAction, null);
  return (
    <form action={action} className="space-y-4">
      <Result state={state} />
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" required minLength={5} maxLength={120} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="categoryId">Category</Label>
        <select
          id="categoryId"
          name="categoryId"
          required
          className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
        >
          <option value="">Select category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" required minLength={30} maxLength={5000} rows={6} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="suggestedBudgetEur">Suggested budget (€, optional)</Label>
          <Input id="suggestedBudgetEur" name="suggestedBudgetEur" type="number" min={0} step="1" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input id="location" name="location" defaultValue="Vienna" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="workMode">Remote or in person</Label>
          <select
            id="workMode"
            name="workMode"
            required
            className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
            defaultValue="in_person"
          >
            <option value="in_person">In person</option>
            <option value="remote">Remote</option>
            <option value="hybrid">Hybrid</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="preferredDate">Preferred date</Label>
          <Input id="preferredDate" name="preferredDate" type="date" />
        </div>
      </div>
      <label className="flex items-start gap-2 text-sm text-slate-600">
        <input
          type="checkbox"
          name="acknowledgePlatform"
          value="true"
          required
          className="mt-0.5 size-4 rounded border border-input"
        />
        <span>
          StudentPro only connects students. I am responsible for independently agreeing on the
          details of any arrangement and complying with applicable laws.
        </span>
      </label>
      <Button type="submit" disabled={pending} className="bg-[#2563EB] hover:bg-blue-700">
        {pending ? "Publishing…" : "Publish Request"}
      </Button>
    </form>
  );
}

export function ApplicationForm({ requestId }: { requestId: string }) {
  const [state, action, pending] = useActionState(submitApplicationAction, null);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="requestId" value={requestId} />
      <Result state={state} />
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
      <p className="text-xs text-slate-500">
        Applications are free in the MVP and are not a legally binding service agreement.
      </p>
      <Button type="submit" disabled={pending}>
        {pending ? "Sending…" : "Send Application"}
      </Button>
    </form>
  );
}

export function ReportForm({
  targetType,
  targetId,
}: {
  targetType: "request" | "profile" | "message" | "review" | "application";
  targetId: string;
}) {
  const [state, action, pending] = useActionState(createReportAction, null);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="targetType" value={targetType} />
      <input type="hidden" name="targetId" value={targetId} />
      <Result state={state} />
      <Input name="reason" placeholder="Reason" required minLength={5} />
      <Textarea name="details" placeholder="Details (optional)" rows={3} />
      <Button type="submit" variant="outline" disabled={pending}>
        {pending ? "Submitting…" : "Submit report"}
      </Button>
    </form>
  );
}
