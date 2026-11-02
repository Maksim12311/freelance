"use client";

import { useActionState } from "react";
import {
  deleteAccountAction,
  requestDataExportAction,
  updateProfileAction,
} from "@/lib/actions/profile";
import { logoutAction } from "@/lib/actions/auth";
import type { ActionResult } from "@/lib/actions/auth";
import type { Profile } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";

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

export function SettingsForms({
  profile,
  universities,
  skills,
  selectedSkillIds,
  blocked,
}: {
  profile: Profile;
  universities: { id: string; name: string }[];
  skills: { id: string; name: string }[];
  selectedSkillIds: string[];
  blocked: Array<{ blocked_id: string; profile?: { display_name: string } | null }>;
}) {
  const [state, action, pending] = useActionState(updateProfileAction, null);

  return (
    <div className="space-y-10">
      <form action={action} className="space-y-4">
        <Result state={state} />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="firstName">First name</Label>
            <Input id="firstName" name="firstName" defaultValue={profile.first_name} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last name</Label>
            <Input id="lastName" name="lastName" defaultValue={profile.last_name} required />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="displayName">Display name</Label>
          <Input id="displayName" name="displayName" defaultValue={profile.display_name} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea id="bio" name="bio" defaultValue={profile.bio ?? ""} rows={4} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="generalLocation">General location</Label>
            <Input
              id="generalLocation"
              name="generalLocation"
              defaultValue={profile.general_location ?? "Vienna"}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="availability">Availability</Label>
            <Input
              id="availability"
              name="availability"
              defaultValue={profile.availability ?? ""}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="universityId">University</Label>
          <select
            id="universityId"
            name="universityId"
            defaultValue={profile.university_id ?? ""}
            className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
          >
            <option value="">Select university</option>
            {universities.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label>Skills</Label>
          <div className="grid gap-2 sm:grid-cols-2">
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
        <div className="space-y-2 rounded-xl border border-slate-200 p-4">
          <p className="text-sm font-medium">Notifications & privacy</p>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="notificationEmail"
              defaultChecked={profile.notification_email}
              className="size-4 rounded border border-input"
            />
            Email notifications
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="notificationMessages"
              defaultChecked={profile.notification_messages}
              className="size-4 rounded border border-input"
            />
            Message notifications
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="notificationApplications"
              defaultChecked={profile.notification_applications}
              className="size-4 rounded border border-input"
            />
            Application notifications
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="privacyShowInDirectory"
              defaultChecked={profile.privacy_show_in_directory}
              className="size-4 rounded border border-input"
            />
            Show in student directory
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="privacyShowUniversity"
              defaultChecked={profile.privacy_show_university}
              className="size-4 rounded border border-input"
            />
            Show university on profile
          </label>
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save changes"}
        </Button>
      </form>

      <div className="space-y-3">
        <h3 className="font-semibold">Student verification</h3>
        <Button variant="outline" render={<Link href="/verify-student" />}>Reverify student status</Button>
      </div>

      <div className="space-y-3">
        <h3 className="font-semibold">Blocked users</h3>
        {blocked.length ? (
          <ul className="space-y-2 text-sm text-slate-600">
            {blocked.map((row) => (
              <li key={row.blocked_id}>{row.profile?.display_name || row.blocked_id}</li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-500">No blocked users.</p>
        )}
      </div>

      <div className="space-y-3 rounded-2xl border border-slate-200 p-4">
        <h3 className="font-semibold">Account</h3>
        <div className="flex flex-wrap gap-2">
          <form action={requestDataExportAction}>
            <Button type="submit" variant="outline">
              Request personal data export
            </Button>
          </form>
          <form action={logoutAction}>
            <Button type="submit" variant="outline">
              Log out
            </Button>
          </form>
          <form action={deleteAccountAction}>
            <Button type="submit" variant="destructive">
              Delete account
            </Button>
          </form>
        </div>
        <p className="text-xs text-slate-500">
          Password changes use Supabase Auth email reset from the login page when needed. Account
          deletion deactivates your profile and attempts auth removal when the service role key is
          configured.
        </p>
      </div>
    </div>
  );
}
