import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isDemoMode } from "@/lib/demo";
import {
  DEFAULT_REMINDER_HOURS_BEFORE,
  DEFAULT_RESPONSE_WINDOW_HOURS,
  isDueForCustomerReminder,
  isEligibleForNoReplyCreditBack,
  noReplyRefundIdempotencyKey,
  type CreditBackApplication,
} from "@/lib/credit-back";
import { getDemoCreditBackStore } from "@/lib/demo-credit-back";

export type CreditBackJobResult = {
  mode: "supabase" | "demo";
  refunded: number;
  reminded: number;
  processedAt: string;
  details?: string[];
};

async function getJobClient() {
  try {
    return createAdminClient() as unknown as Awaited<ReturnType<typeof createClient>>;
  } catch {
    return createClient();
  }
}

async function getWindowConfig() {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("pricing_settings")
      .select("metadata")
      .eq("key", "application_response_window_hours")
      .maybeSingle();
    const meta = (data?.metadata ?? {}) as Record<string, unknown>;
    const hours = Number(meta.hours ?? DEFAULT_RESPONSE_WINDOW_HOURS);
    const reminder = Number(meta.reminder_hours_before ?? DEFAULT_REMINDER_HOURS_BEFORE);
    return {
      hours: Number.isFinite(hours) && hours > 0 ? hours : DEFAULT_RESPONSE_WINDOW_HOURS,
      reminderHoursBefore:
        Number.isFinite(reminder) && reminder > 0 ? reminder : DEFAULT_REMINDER_HOURS_BEFORE,
    };
  } catch {
    return {
      hours: DEFAULT_RESPONSE_WINDOW_HOURS,
      reminderHoursBefore: DEFAULT_REMINDER_HOURS_BEFORE,
    };
  }
}

/**
 * Process expired unanswered applications + customer reminders.
 * Prefer calling the SQL function when Supabase is available; fall back to
 * application-level logic (and demo in-memory store) otherwise.
 */
export async function runNoReplyCreditBackJob(
  now: Date = new Date(),
): Promise<CreditBackJobResult> {
  const processedAt = now.toISOString();

  if (isDemoMode()) {
    return runDemoJob(now, processedAt);
  }

  const supabase = await getJobClient();

  // Prefer DB function (atomic + RLS-safe via security definer).
  try {
    const { data, error } = await supabase.rpc("process_no_reply_credit_back", {
      p_now: processedAt,
    });
    if (!error && data) {
      const payload = data as { refunded?: number; reminded?: number };
      return {
        mode: "supabase",
        refunded: Number(payload.refunded ?? 0),
        reminded: Number(payload.reminded ?? 0),
        processedAt,
      };
    }
  } catch {
    // fall through to TS implementation
  }

  return runTypescriptJob(supabase, now, processedAt);
}

async function runTypescriptJob(
  supabase: Awaited<ReturnType<typeof createClient>>,
  now: Date,
  processedAt: string,
): Promise<CreditBackJobResult> {
  const { reminderHoursBefore } = await getWindowConfig();
  const details: string[] = [];
  let refunded = 0;
  let reminded = 0;

  const { data: due } = await supabase
    .from("applications")
    .select(
      "id, applicant_id, request_id, credit_id, fee_eur, payment_id, status, created_at, response_deadline_at, customer_responded_at, customer_response_kind, awaiting_customer_response, credit_refunded_at, credit_refund_ledger_id, customer_deadline_reminder_sent_at",
    )
    .eq("awaiting_customer_response", true)
    .is("customer_responded_at", null)
    .is("credit_refunded_at", null)
    .lte("response_deadline_at", processedAt)
    .limit(200);

  for (const row of due ?? []) {
    const app = row as CreditBackApplication;
    if (!isEligibleForNoReplyCreditBack(app, now)) continue;
    const ok = await refundCreditOnce(supabase, app);
    if (ok) {
      refunded += 1;
      details.push(`refunded:${app.id}`);
    }
  }

  const reminderCutoff = new Date(
    now.getTime() + reminderHoursBefore * 60 * 60 * 1000,
  ).toISOString();

  const { data: reminderCandidates } = await supabase
    .from("applications")
    .select(
      "id, applicant_id, request_id, credit_id, fee_eur, payment_id, status, created_at, response_deadline_at, customer_responded_at, customer_response_kind, awaiting_customer_response, credit_refunded_at, credit_refund_ledger_id, customer_deadline_reminder_sent_at, request:requests(owner_id, title)",
    )
    .eq("awaiting_customer_response", true)
    .is("customer_responded_at", null)
    .is("credit_refunded_at", null)
    .is("customer_deadline_reminder_sent_at", null)
    .gt("response_deadline_at", processedAt)
    .lte("response_deadline_at", reminderCutoff)
    .limit(200);

  for (const row of reminderCandidates ?? []) {
    const app = row as CreditBackApplication & {
      request?: { owner_id: string; title: string } | { owner_id: string; title: string }[] | null;
    };
    if (!isDueForCustomerReminder(app, now, reminderHoursBefore)) continue;
    const request = Array.isArray(app.request) ? app.request[0] : app.request;
    if (!request?.owner_id) continue;

    await supabase.from("notifications").insert({
      profile_id: request.owner_id,
      type: "application",
      title: "Respond before the deadline",
      body: `A specialist applied to “${request.title}”. Message, accept, or decline before the deadline — viewing alone is not enough, or their credit will be returned.`,
      link_path: `/requests/${app.request_id}`,
    });

    await supabase
      .from("applications")
      .update({ customer_deadline_reminder_sent_at: processedAt })
      .eq("id", app.id)
      .is("customer_deadline_reminder_sent_at", null);

    reminded += 1;
    details.push(`reminded:${app.id}`);
  }

  return { mode: "supabase", refunded, reminded, processedAt, details };
}

async function refundCreditOnce(
  supabase: Awaited<ReturnType<typeof createClient>>,
  app: CreditBackApplication,
): Promise<boolean> {
  const idempotencyKey = noReplyRefundIdempotencyKey(app.id);

  const { data: existing } = await supabase
    .from("application_credit_ledger")
    .select("id")
    .eq("idempotency_key", idempotencyKey)
    .maybeSingle();

  if (existing?.id) {
    await supabase
      .from("applications")
      .update({
        credit_refunded_at: new Date().toISOString(),
        credit_refund_ledger_id: existing.id,
        awaiting_customer_response: false,
      })
      .eq("id", app.id);
    return false;
  }

  const { data: credit, error: creditError } = await supabase
    .from("application_credits")
    .insert({
      profile_id: app.applicant_id,
      source: "refund",
      remaining: 1,
      initial_amount: 1,
      note: "No-reply credit return (customer did not respond within the window)",
    })
    .select("id")
    .single();

  if (creditError || !credit) return false;

  const { data: ledger, error: ledgerError } = await supabase
    .from("application_credit_ledger")
    .insert({
      profile_id: app.applicant_id,
      application_id: app.id,
      credit_id: credit.id,
      payment_id: app.payment_id,
      entry_type: "refund_no_reply",
      amount: 1,
      balance_after: 1,
      idempotency_key: idempotencyKey,
      note: "Automatic credit return — no customer response before deadline",
      metadata: {
        response_deadline_at: app.response_deadline_at,
        original_credit_id: app.credit_id,
        fee_eur: app.fee_eur,
      },
    })
    .select("id")
    .single();

  if (ledgerError || !ledger) {
    // Unique violation = already refunded concurrently
    if (ledgerError?.code === "23505") return false;
    return false;
  }

  await supabase
    .from("applications")
    .update({
      credit_refunded_at: new Date().toISOString(),
      credit_refund_ledger_id: ledger.id,
      awaiting_customer_response: false,
    })
    .eq("id", app.id)
    .is("credit_refunded_at", null);

  await supabase.from("notifications").insert({
    profile_id: app.applicant_id,
    type: "application",
    title: "Application credit returned",
    body: "The customer did not respond within 72 hours. 1 application credit was returned to your balance. Statutory rights for monetary payments remain separate.",
    link_path: "/dashboard/applications",
  });

  return true;
}

function runDemoJob(now: Date, processedAt: string): CreditBackJobResult {
  const store = getDemoCreditBackStore();
  const { reminderHoursBefore } = {
    reminderHoursBefore: DEFAULT_REMINDER_HOURS_BEFORE,
  };
  let refunded = 0;
  let reminded = 0;
  const details: string[] = [];

  for (const app of store.list()) {
    if (isEligibleForNoReplyCreditBack(app, now)) {
      const result = store.refundOnce(app.id, now);
      if (result.refunded) {
        refunded += 1;
        details.push(`refunded:${app.id}`);
      }
      continue;
    }
    if (isDueForCustomerReminder(app, now, reminderHoursBefore)) {
      if (store.markReminderSent(app.id, now)) {
        reminded += 1;
        details.push(`reminded:${app.id}`);
      }
    }
  }

  return { mode: "demo", refunded, reminded, processedAt, details };
}
