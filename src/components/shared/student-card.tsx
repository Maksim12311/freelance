import Link from "next/link";
import { Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
    <Link href={`/students/${student.id}`} className="group block h-full">
      <Card className="h-full border-slate-200/80 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800">
        <CardContent className="flex h-full flex-col gap-4 p-5">
          <div className="flex items-start gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={student.avatar_url ?? undefined} alt="" />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate font-semibold transition group-hover:text-[#2563EB]">
                  {student.display_name}
                </h3>
                {student.verification_status === "verified" ? (
                  <VerifiedBadge compact />
                ) : null}
              </div>
              <p className="truncate text-sm text-slate-500">
                {student.university?.short_name || student.university?.name || "University student"}
                {student.general_location ? ` · ${student.general_location}` : null}
              </p>
            </div>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {student.bio ? truncate(student.bio, 120) : "No bio yet."}
          </p>
          <div className="mt-auto flex flex-wrap gap-2">
            {(student.skills ?? []).slice(0, 3).map((skill) => (
              <Badge key={skill.name} variant="secondary">
                {skill.name}
              </Badge>
            ))}
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              {student.average_rating != null
                ? student.average_rating.toFixed(1)
                : "No ratings"}
            </span>
            <span>{student.completed_collaborations_count} collaborations</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
