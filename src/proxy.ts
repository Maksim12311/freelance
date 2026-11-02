import { type NextRequest, NextResponse } from "next/server";

import { DEMO_COOKIE, DEMO_PROFILE_ID } from "@/lib/demo";
import { updateSession } from "@/lib/supabase/middleware";

/** Routes that require a verified student (or admin). */
const MARKETPLACE_PREFIXES = [
  "/requests",
  "/students",
  "/messages",
  "/dashboard",
] as const;

/** Routes that require login but not verification. */
const AUTH_ONLY_PREFIXES = ["/settings", "/verify-student", "/admin"] as const;

function matchesPrefix(pathname: string, prefixes: readonly string[]) {
  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function isAdminPath(pathname: string) {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

function isVerificationActive(profile: {
  verification_status: string | null;
  is_suspended: boolean | null;
  verification_expires_at: string | null;
}) {
  if (profile.verification_status !== "verified") return false;
  if (profile.is_suspended) return false;
  if (!profile.verification_expires_at) return true;
  return new Date(profile.verification_expires_at).getTime() > Date.now();
}

function isDemoMode() {
  return !(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const intended = `${pathname}${search}`;
  const needsMarketplace = matchesPrefix(pathname, MARKETPLACE_PREFIXES);
  const needsAuth = needsMarketplace || matchesPrefix(pathname, AUTH_ONLY_PREFIXES);

  // No database: cookie session stands in for Supabase auth.
  if (isDemoMode()) {
    const demo = request.cookies.get(DEMO_COOKIE)?.value === "1";
    if (!needsAuth) {
      return NextResponse.next();
    }
    if (!demo) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.search = "";
      loginUrl.searchParams.set("next", intended);
      return NextResponse.redirect(loginUrl);
    }
    // Demo user is always verified admin — allow marketplace + admin.
    void DEMO_PROFILE_ID;
    return NextResponse.next();
  }

  const { supabaseResponse, user, supabase } = await updateSession(request);

  if (!needsAuth) {
    return supabaseResponse;
  }

  if (!user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = "";
    loginUrl.searchParams.set("next", intended);
    return NextResponse.redirect(loginUrl);
  }

  if (!supabase) {
    return supabaseResponse;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin, is_suspended, verification_status, verification_expires_at")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.is_suspended) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = "";
    loginUrl.searchParams.set("error", "suspended");
    return NextResponse.redirect(loginUrl);
  }

  if (isAdminPath(pathname)) {
    if (!profile?.is_admin) {
      const homeUrl = request.nextUrl.clone();
      homeUrl.pathname = "/";
      homeUrl.search = "";
      return NextResponse.redirect(homeUrl);
    }
    return supabaseResponse;
  }

  if (needsMarketplace) {
    const allowed = Boolean(profile?.is_admin) || (profile ? isVerificationActive(profile) : false);
    if (!allowed) {
      const verifyUrl = request.nextUrl.clone();
      verifyUrl.pathname = "/verify-student";
      verifyUrl.search = "";
      verifyUrl.searchParams.set("next", intended);
      return NextResponse.redirect(verifyUrl);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
