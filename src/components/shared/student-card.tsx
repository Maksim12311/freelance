import Link from "next/link";
import { Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { VerifiedBadge } from "@/components/shared/verified-badge";
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
  const initials = student.display_name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Link
      href={`/students/${student.id}`}
      className="group flex h-full flex-col gap-4 rounded-2xl border border-[#d7e3ef] bg-white p-5 transition duration-300 hover:-translate-y-0.5 hover:border-teal-300/70 hover:bg-[#f3faf9]"
    >
      <div className="flex items-start gap-3">
        <Avatar className="h-12 w-12">
          <AvatarImage src={student.avatar_url ?? undefined} alt="" />
          <AvatarFallback className="bg-[#e8f3ff] font-heading text-[#2563EB]">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate font-heading font-semibold transition group-hover:text-[#2563EB]">
              {student.display_name}
            </h3>
            {student.verification_status === "verified" ? <VerifiedBadge compact /> : null}
          </div>
          <p className="truncate text-sm text-[#5b6b7c]">
            {student.university?.short_name || student.university?.name || "University student"}
            {student.general_location ? ` · ${student.general_location}` : null}
          </p>
        </div>
      </div>
      <p className="text-sm leading-relaxed text-[#5b6b7c]">
        {student.bio ? truncate(student.bio, 120) : "No bio yet."}
      </p>
      <div className="mt-auto flex flex-wrap gap-2">
        {(student.skills ?? []).slice(0, 3).map((skill) => (
          <span
            key={skill.name}
            className="rounded-md bg-[#eef5fb] px-2 py-1 text-xs font-medium text-[#0b1220]"
          >
            {skill.name}
          </span>
        ))}
      </div>
      <div className="flex items-center gap-3 border-t border-[#eef5fb] pt-3 text-xs text-[#5b6b7c]">
        <span className="inline-flex items-center gap-1">
          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
          {student.average_rating != null ? student.average_rating.toFixed(1) : "No ratings"}
        </span>
        <span>{student.completed_collaborations_count} collaborations</span>
      </div>
    </Link>
  );
}
