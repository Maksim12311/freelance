/**
 * No Reply → Credit Back
 *
 * Specialists who spend an application credit get it back if the customer
 * does not respond (message / accept / reject) within the response window.
 * Viewing an application does NOT count as a response.
 *
 * Monetary Stripe payments retain separate statutory refund rights; this
 * module returns application *credits* only.
 */

export const DEFAULT_RESPONSE_WINDOW_HOURS = 72;
export const DEFAULT_REMINDER_HOURS_BEFORE = 24;

export type CustomerResponseKind = "message" | "accept" | "reject";

export type CreditBackApplication = {
  id: string;
  applicant_id: string;
  request_id: string;
  credit_id: string | null;
  fee_eur: number | null;
  payment_id: string | null;
  status: string;
  created_at: string;
  response_deadline_at: string | null;
  customer_responded_at: string | null;
  customer_response_kind: CustomerResponseKind | null;
  awaiting_customer_response: boolean;
  credit_refunded_at: string | null;
  credit_refund_ledger_id: string | null;
  customer_deadline_reminder_sent_at: string | null;
};

export function noReplyRefundIdempotencyKey(applicationId: string) {
  return `no_reply_refund:${applicationId}`;
}

export function computeResponseDeadline(
  unlockedAt: Date | string,
  windowHours = DEFAULT_RESPONSE_WINDOW_HOURS,
): Date {
  const start = typeof unlockedAt === "string" ? new Date(unlockedAt) : unlockedAt;
  return new Date(start.getTime() + windowHours * 60 * 60 * 1000);
}

/** Viewing never counts. Only message / accept / reject. */
export function isCustomerResponseKind(value: string): value is CustomerResponseKind {
  return value === "message" || value === "accept" || value === "reject";
}

export function isEligibleForNoReplyCreditBack(
  app: Pick<
    CreditBackApplication,
    | "awaiting_customer_response"
    | "customer_responded_at"
    | "credit_refunded_at"
    | "response_deadline_at"
    | "credit_id"
    | "fee_eur"
  >,
  now: Date = new Date(),
): boolean {
  if (!app.awaiting_customer_response) return false;
  if (app.customer_responded_at) return false;
  if (app.credit_refunded_at) return false;
  if (!app.response_deadline_at) return false;
  if (new Date(app.response_deadline_at).getTime() > now.getTime()) return false;
  // Must have spent a credit or paid a fee (credit path sets credit_id).
  if (!app.credit_id && !(app.fee_eur && app.fee_eur > 0)) return false;
  return true;
}

export function isDueForCustomerReminder(
  app: Pick<
    CreditBackApplication,
    | "awaiting_customer_response"
    | "customer_responded_at"
    | "credit_refunded_at"
    | "response_deadline_at"
    | "customer_deadline_reminder_sent_at"
  >,
  now: Date = new Date(),
  reminderHoursBefore = DEFAULT_REMINDER_HOURS_BEFORE,
): boolean {
  if (!app.awaiting_customer_response) return false;
  if (app.customer_responded_at) return false;
  if (app.credit_refunded_at) return false;
  if (app.customer_deadline_reminder_sent_at) return false;
  if (!app.response_deadline_at) return false;
  const deadline = new Date(app.response_deadline_at).getTime();
  const nowMs = now.getTime();
  if (deadline <= nowMs) return false;
  const reminderAt = deadline - reminderHoursBefore * 60 * 60 * 1000;
  return nowMs >= reminderAt;
}

export type ApplicationCreditBackStatus =
  | "not_applicable"
  | "awaiting_response"
  | "responded"
  | "credit_returned"
  | "expired_pending_job";

export function getCreditBackStatus(
  app: Pick<
    CreditBackApplication,
    | "awaiting_customer_response"
    | "customer_responded_at"
    | "customer_response_kind"
    | "credit_refunded_at"
    | "response_deadline_at"
    | "credit_id"
    | "fee_eur"
  >,
  now: Date = new Date(),
): ApplicationCreditBackStatus {
  if (app.credit_refunded_at) return "credit_returned";
  if (app.customer_responded_at) return "responded";
  if (!app.response_deadline_at) return "not_applicable";
  if (!app.credit_id && !(app.fee_eur && app.fee_eur > 0) && !app.awaiting_customer_response) {
    return "not_applicable";
  }
  if (new Date(app.response_deadline_at).getTime() <= now.getTime()) {
    return app.awaiting_customer_response ? "expired_pending_job" : "not_applicable";
  }
  if (app.awaiting_customer_response) return "awaiting_response";
  return "not_applicable";
}

export function formatCountdown(
  deadlineIso: string | null | undefined,
  now: Date = new Date(),
): { label: string; expired: boolean; msRemaining: number } {
  if (!deadlineIso) {
    return { label: "—", expired: false, msRemaining: 0 };
  }
  const msRemaining = new Date(deadlineIso).getTime() - now.getTime();
  if (msRemaining <= 0) {
    return { label: "Deadline passed", expired: true, msRemaining: 0 };
  }
  const totalMinutes = Math.floor(msRemaining / 60_000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) {
    return {
      label: `${days}d ${hours}h left`,
      expired: false,
      msRemaining,
    };
  }
  if (hours > 0) {
    return {
      label: `${hours}h ${minutes}m left`,
      expired: false,
      msRemaining,
    };
  }
  return {
    label: `${Math.max(minutes, 1)}m left`,
    expired: false,
    msRemaining,
  };
}

export const CREDIT_BACK_POLICY_SHORT =
  "If the customer does not message, accept, or decline within 72 hours, 1 application credit is returned automatically. Viewing does not count as a response. Statutory rights for monetary card payments are separate and unaffected.";

export const CREDIT_BACK_POLICY_CUSTOMER =
  "Please message, accept, or decline applications within 72 hours. Viewing alone is not a response. If you do nothing, the specialist’s application credit is returned automatically.";
