import Link from "next/link";
import { truncate } from "@/lib/utils";

export type StudentCardData = {
  id: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  general_location: string | null;
  average_rating: number | null;
  completed_collaborations_count: number;
  verification_status: string;
  university?: { name: string; short_name: string | null } | null;
  skills?: { name: string }[];
};

export function StudentCard({ student }: { student: StudentCardData }) {
  return (
    <Link
      href={`/students/${student.id}`}
      className="block rounded-2xl bg-white p-5 shadow-[0_14px_30px_-24px_rgba(15,118,110,0.35)] ring-1 ring-[#dbe7f5] transition hover:-translate-y-0.5 hover:ring-teal-200"
    >
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="font-heading font-semibold text-slate-900">{student.display_name}</h3>
        {student.verification_status === "verified" ? (
          <span className="rounded-md bg-[#e6f7f4] px-2 py-0.5 text-xs font-medium text-[#0f766e]">
            Verified
          </span>
        ) : null}
      </div>
      <p className="mt-1 text-sm text-slate-500">
        {student.university?.short_name || student.university?.name || "University student"}
        {student.general_location ? ` · ${student.general_location}` : ""}
      </p>
      <p className="mt-3 text-sm leading-relaxed text-slate-600">
        {student.bio ? truncate(student.bio, 110) : "No bio yet."}
      </p>
      {(student.skills?.length ?? 0) > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {(student.skills ?? []).slice(0, 3).map((skill) => (
            <span
              key={skill.name}
              className="rounded-md bg-[#eaf2ff] px-2 py-1 text-xs font-medium text-[#1e3a8a]"
            >
              {skill.name}
            </span>
          ))}
        </div>
      ) : null}
    </Link>
  );
}
