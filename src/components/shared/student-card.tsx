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
      className="block rounded-xl border border-slate-200 bg-white p-4 hover:border-slate-300 hover:bg-slate-50"
    >
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="font-medium text-slate-900">{student.display_name}</h3>
        {student.verification_status === "verified" ? (
          <span className="text-xs text-[#2563EB]">Verified</span>
        ) : null}
      </div>
      <p className="mt-1 text-sm text-slate-500">
        {student.university?.short_name || student.university?.name || "University student"}
        {student.general_location ? ` · ${student.general_location}` : ""}
      </p>
      <p className="mt-3 text-sm text-slate-600">
        {student.bio ? truncate(student.bio, 110) : "No bio yet."}
      </p>
      {(student.skills?.length ?? 0) > 0 ? (
        <p className="mt-3 text-xs text-slate-500">
          {(student.skills ?? [])
            .slice(0, 3)
            .map((s) => s.name)
            .join(" · ")}
        </p>
      ) : null}
    </Link>
  );
}
