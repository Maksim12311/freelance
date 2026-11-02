import { notFound } from "next/navigation";
import { PublicShell } from "@/components/layout/public-shell";
import { VerifiedBadge } from "@/components/shared/verified-badge";
import { ReportForm } from "@/components/forms/request-forms";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isVerificationActive, requireVerifiedStudent } from "@/lib/auth";
import { startConversationAction } from "@/lib/actions/messages";
import { hasSupabaseEnv } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { getInitials } from "@/lib/utils";

export const metadata = { title: "Student profile" };

export default async function StudentProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const current = await requireVerifiedStudent(`/students/${id}`);

  if (!hasSupabaseEnv()) {
    return (
      <PublicShell>
        <div className="mx-auto max-w-3xl px-4 py-16 text-sm text-slate-600">
          Configure Supabase credentials to view student profiles.
        </div>
      </PublicShell>
    );
  }

  const supabase = await createClient();
  const { data: student } = await supabase
    .from("profiles")
    .select(
      "*, university:universities(name, short_name), profile_skills(skill:skills(name))",
    )
    .eq("id", id)
    .maybeSingle();

  if (!student || student.is_suspended) notFound();
  if (
    student.verification_status !== "verified" &&
    current?.id !== student.id &&
    !current?.is_admin
  ) {
    notFound();
  }

  const { data: reviews } = await supabase
    .from("reviews")
    .select(
      "id, overall_rating, communication_rating, reliability_rating, comment, created_at, reviewer:profiles!reviews_reviewer_id_fkey(display_name)",
    )
    .eq("reviewee_id", id)
    .eq("is_hidden", false)
    .order("created_at", { ascending: false })
    .limit(20);

  const university = Array.isArray(student.university)
    ? student.university[0]
    : student.university;
  const skills =
    (student.profile_skills as Array<{ skill: { name: string } | null }> | null)
      ?.map((row) => (Array.isArray(row.skill) ? row.skill[0] : row.skill))
      .filter(Boolean) ?? [];

  const canMessage =
    current &&
    current.id !== student.id &&
    isVerificationActive(current) &&
    student.verification_status === "verified";

  return (
    <PublicShell>
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 lg:grid-cols-[1.2fr_0.8fr] sm:px-6">
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={student.avatar_url ?? undefined} alt="" />
              <AvatarFallback>{getInitials(student.display_name)}</AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-3xl font-semibold tracking-tight">{student.display_name}</h1>
                {student.verification_status === "verified" ? <VerifiedBadge /> : null}
              </div>
              <p className="text-slate-600">
                {student.privacy_show_university
                  ? university?.name || "University student"
                  : "University student"}
                {student.general_location ? ` · ${student.general_location}` : ""}
              </p>
            </div>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>About</CardTitle>
            </CardHeader>
            <CardContent className="text-slate-700 whitespace-pre-wrap">
              {student.bio || "This student has not added a bio yet."}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Reviews</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-slate-500">
                Ratings are peer feedback only — not proof of legal authorization, professional
                certification, or guaranteed quality.
              </p>
              {reviews?.length ? (
                reviews.map((review) => {
                  const reviewer = Array.isArray(review.reviewer)
                    ? review.reviewer[0]
                    : review.reviewer;
                  return (
                    <div key={review.id} className="rounded-xl border border-slate-200 p-4">
                      <p className="font-medium">
                        {review.overall_rating}/5 · {reviewer?.display_name}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Communication {review.communication_rating} · Reliability{" "}
                        {review.reliability_rating}
                      </p>
                      {review.comment ? (
                        <p className="mt-2 text-sm text-slate-600">{review.comment}</p>
                      ) : null}
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-slate-500">No reviews yet.</p>
              )}
            </CardContent>
          </Card>
        </div>
        <div className="space-y-4">
          <Card>
            <CardContent className="space-y-3 pt-6 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Rating</span>
                <span className="font-medium">
                  {student.average_rating != null
                    ? Number(student.average_rating).toFixed(1)
                    : "No ratings"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Collaborations</span>
                <span className="font-medium">{student.completed_collaborations_count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Availability</span>
                <span className="font-medium">{student.availability || "Not specified"}</span>
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                {skills.map((skill) => (
                  <Badge key={skill!.name} variant="secondary">
                    {skill!.name}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
          {canMessage ? (
            <form
              action={async () => {
                "use server";
                await startConversationAction(student.id);
              }}
            >
              <Button type="submit" className="w-full bg-[#2563EB] hover:bg-blue-700">
                Message student
              </Button>
            </form>
          ) : null}
          {current && current.id !== student.id ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Report profile</CardTitle>
              </CardHeader>
              <CardContent>
                <ReportForm targetType="profile" targetId={student.id} />
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </PublicShell>
  );
}
