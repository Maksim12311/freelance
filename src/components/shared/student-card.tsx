import Link from "next/link";
import { Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
      className="group flex h-full flex-col gap-4 rounded-[1.5rem] border border-slate-200/90 bg-white p-5 transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_24px_48px_-32px_rgba(37,99,235,0.45)]"
    >
      <div className="flex items-start gap-3">
        <Avatar className="h-12 w-12 ring-2 ring-blue-50">
          <AvatarImage src={student.avatar_url ?? undefined} alt="" />
          <AvatarFallback className="bg-blue-50 font-heading text-[#2563EB]">
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
          <p className="truncate text-sm text-slate-500">
            {student.university?.short_name || student.university?.name || "University student"}
            {student.general_location ? ` · ${student.general_location}` : null}
          </p>
        </div>
      </div>
      <p className="text-sm leading-relaxed text-slate-600">
        {student.bio ? truncate(student.bio, 120) : "No bio yet."}
      </p>
      <div className="mt-auto flex flex-wrap gap-2">
        {(student.skills ?? []).slice(0, 3).map((skill) => (
          <Badge key={skill.name} variant="secondary" className="rounded-md">
            {skill.name}
          </Badge>
        ))}
      </div>
      <div className="flex items-center gap-3 border-t border-slate-100 pt-3 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1">
          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
          {student.average_rating != null ? student.average_rating.toFixed(1) : "No ratings"}
        </span>
        <span>{student.completed_collaborations_count} collaborations</span>
      </div>
    </Link>
  );
}
