import type { MatchReason } from "@/lib/matching";

export function MatchReasons({ reasons }: { reasons: MatchReason[] }) {
  if (!reasons.length) return null;
  return (
    <ul className="mt-2 flex flex-wrap gap-1.5">
      {reasons
        .filter((r) => r.code !== "boost" && r.code !== "plus")
        .slice(0, 4)
        .map((reason) => (
          <li
            key={`${reason.code}-${reason.label}`}
            className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
          >
            {reason.label}
          </li>
        ))}
    </ul>
  );
}
