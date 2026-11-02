import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const nextRaw = searchParams.get("next") ?? "/dashboard";
  const next = nextRaw.startsWith("/") && !nextRaw.startsWith("//") ? nextRaw : "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const userId = data.user?.id;
      if (userId) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("verification_status, verification_expires_at, is_suspended, is_admin")
          .eq("id", userId)
          .maybeSingle();

        const verified =
          profile &&
          !profile.is_suspended &&
          (profile.is_admin ||
            (profile.verification_status === "verified" &&
              (!profile.verification_expires_at ||
                new Date(profile.verification_expires_at).getTime() > Date.now())));

        if (!verified) {
          return NextResponse.redirect(
            `${origin}/verify-student?next=${encodeURIComponent(next)}`,
          );
        }
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
