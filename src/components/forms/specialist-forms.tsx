"use client";

import { useActionState } from "react";
import {
  addPortfolioItemAction,
  updateSpecialistProfileAction,
} from "@/lib/actions/specialist";
import type { ActionResult } from "@/lib/actions/auth";
import type { Profile } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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

export function SpecialistProfileForm({
  profile,
  skills,
  selectedSkillIds,
}: {
  profile: Profile;
  skills: { id: string; name: string }[];
  selectedSkillIds: string[];
}) {
  const [state, action, pending] = useActionState(updateSpecialistProfileAction, null);

  return (
    <form action={action} className="space-y-4">
      <Result state={state} />
      <div className="space-y-2">
        <Label htmlFor="specialistHeadline">Headline</Label>
        <Input
          id="specialistHeadline"
          name="specialistHeadline"
          defaultValue={profile.specialist_headline ?? ""}
          maxLength={120}
          placeholder="e.g. Tutoring & academic writing"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="specialistBio">Specialist bio</Label>
        <Textarea
          id="specialistBio"
          name="specialistBio"
          defaultValue={profile.specialist_bio ?? ""}
          rows={4}
          maxLength={3000}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="preferredBudgetMinEur">Preferred min budget (€)</Label>
          <Input
            id="preferredBudgetMinEur"
            name="preferredBudgetMinEur"
            type="number"
            min={0}
            defaultValue={profile.preferred_budget_min_eur ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="preferredBudgetMaxEur">Preferred max budget (€)</Label>
          <Input
            id="preferredBudgetMaxEur"
            name="preferredBudgetMaxEur"
            type="number"
            min={0}
            defaultValue={profile.preferred_budget_max_eur ?? ""}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="availability">Availability</Label>
        <Input
          id="availability"
          name="availability"
          defaultValue={profile.availability ?? ""}
          placeholder="Weekdays after 16:00, weekends flexible"
        />
      </div>
      <div className="space-y-2">
        <Label>Skills / categories</Label>
        <div className="grid max-h-48 gap-2 overflow-y-auto rounded-xl border border-slate-200 p-3 sm:grid-cols-2">
          {skills.map((skill) => (
            <label key={skill.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="skillIds"
                value={skill.id}
                defaultChecked={selectedSkillIds.includes(skill.id)}
                className="size-4 rounded border border-input"
              />
              {skill.name}
            </label>
          ))}
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="remoteAvailable"
          defaultChecked={profile.remote_available ?? true}
          className="size-4 rounded border border-input"
        />
        Available for remote work
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="acceptsInvitations"
          defaultChecked={profile.accepts_invitations ?? true}
          className="size-4 rounded border border-input"
        />
        Accept customer invitations
      </label>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save specialist profile"}
      </Button>
    </form>
  );
}

export function PortfolioAddForm() {
  const [state, action, pending] = useActionState(addPortfolioItemAction, null);
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2">
      <Result state={state} />
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" required minLength={2} />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" rows={2} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="imageUrl">Image URL</Label>
        <Input id="imageUrl" name="imageUrl" type="url" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="linkUrl">Link URL</Label>
        <Input id="linkUrl" name="linkUrl" type="url" />
      </div>
      <div className="sm:col-span-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Adding…" : "Add item"}
        </Button>
      </div>
    </form>
  );
}
