import { NextResponse } from "next/server";
import { runNoReplyCreditBackJob } from "@/lib/credit-back-job";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Scheduled job for No Reply → Credit Back.
 *
 * Auth: Authorization: Bearer $CRON_SECRET  (or x-cron-secret header)
 *
 * Examples:
 *   curl -X POST http://localhost:3000/api/cron/credit-back \
 *     -H "Authorization: Bearer $CRON_SECRET"
 *
 *   # Demo / local without secret when CRON_SECRET is unset:
 *   curl -X POST http://localhost:3000/api/cron/credit-back
 */
export async function POST(request: Request) {
  const limited = rateLimit("cron:credit-back", 30, 60_000);
  if (!limited.ok) {
    return NextResponse.json(
      { ok: false, error: "Rate limited" },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } },
    );
  }

  const expected = process.env.CRON_SECRET?.trim();
  if (expected) {
    const header =
      request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim() ||
      request.headers.get("x-cron-secret")?.trim() ||
      "";
    if (header !== expected) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const result = await runNoReplyCreditBackJob(new Date());
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Job failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  // Allow GET for simple uptime pings when secret is configured and provided.
  return POST(request);
}
