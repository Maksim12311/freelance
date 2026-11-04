import {
  computeResponseDeadline,
  DEFAULT_RESPONSE_WINDOW_HOURS,
  noReplyRefundIdempotencyKey,
  type CreditBackApplication,
  type CustomerResponseKind,
} from "@/lib/credit-back";
import { DEMO_PROFILE_ID } from "@/lib/demo";

type LedgerEntry = {
  id: string;
  profile_id: string;
  application_id: string;
  entry_type: string;
  amount: number;
  idempotency_key: string;
  created_at: string;
};

type DemoStoreState = {
  applications: Map<string, CreditBackApplication>;
  ledger: Map<string, LedgerEntry>;
  creditsByProfile: Map<string, number>;
  notifications: Array<{
    profile_id: string;
    title: string;
    body: string;
    created_at: string;
  }>;
};

const globalKey = "__studentpro_demo_credit_back__";

function state(): DemoStoreState {
  const g = globalThis as unknown as Record<string, DemoStoreState | undefined>;
  if (!g[globalKey]) {
    g[globalKey] = {
      applications: new Map(),
      ledger: new Map(),
      creditsByProfile: new Map([[DEMO_PROFILE_ID, 2]]),
      notifications: [],
    };
  }
  return g[globalKey]!;
}

export function getDemoCreditBackStore() {
  const s = state();

  return {
    list(): CreditBackApplication[] {
      return [...s.applications.values()];
    },

    get(id: string) {
      return s.applications.get(id) ?? null;
    },

    listForApplicant(applicantId: string) {
      return [...s.applications.values()].filter((a) => a.applicant_id === applicantId);
    },

    listForRequest(requestId: string) {
      return [...s.applications.values()].filter((a) => a.request_id === requestId);
    },

    creditBalance(profileId: string) {
      return s.creditsByProfile.get(profileId) ?? 0;
    },

    consumeCredit(profileId: string): string | null {
      const bal = s.creditsByProfile.get(profileId) ?? 0;
      if (bal < 1) return null;
      s.creditsByProfile.set(profileId, bal - 1);
      const creditId = `demo-credit-consume-${profileId}-${Date.now()}`;
      const key = `consume:${creditId}`;
      s.ledger.set(key, {
        id: key,
        profile_id: profileId,
        application_id: "",
        entry_type: "consume",
        amount: -1,
        idempotency_key: key,
        created_at: new Date().toISOString(),
      });
      return creditId;
    },

    createPaidApplication(input: {
      id?: string;
      applicantId: string;
      requestId: string;
      unlockedAt?: Date;
      windowHours?: number;
      feeEur?: number;
    }): CreditBackApplication {
      const unlockedAt = input.unlockedAt ?? new Date();
      const creditId = this.consumeCredit(input.applicantId);
      const deadline = computeResponseDeadline(
        unlockedAt,
        input.windowHours ?? DEFAULT_RESPONSE_WINDOW_HOURS,
      );
      const app: CreditBackApplication = {
        id: input.id ?? `demo-app-${Date.now()}`,
        applicant_id: input.applicantId,
        request_id: input.requestId,
        credit_id: creditId,
        fee_eur: input.feeEur ?? 1.99,
        payment_id: creditId ? `demo-pay-${creditId}` : null,
        status: "sent",
        created_at: unlockedAt.toISOString(),
        response_deadline_at: creditId ? deadline.toISOString() : null,
        customer_responded_at: null,
        customer_response_kind: null,
        awaiting_customer_response: Boolean(creditId),
        credit_refunded_at: null,
        credit_refund_ledger_id: null,
        customer_deadline_reminder_sent_at: null,
      };
      s.applications.set(app.id, app);
      return app;
    },

    markCustomerResponse(applicationId: string, kind: CustomerResponseKind, at = new Date()) {
      const app = s.applications.get(applicationId);
      if (!app) return false;
      if (app.customer_responded_at) return true;
      app.customer_responded_at = at.toISOString();
      app.customer_response_kind = kind;
      app.awaiting_customer_response = false;
      if (kind === "accept") app.status = "accepted";
      if (kind === "reject") app.status = "declined";
      s.applications.set(applicationId, app);
      return true;
    },

    refundOnce(applicationId: string, at = new Date()) {
      const app = s.applications.get(applicationId);
      if (!app) return { refunded: false, ledgerId: null as string | null };
      const key = noReplyRefundIdempotencyKey(applicationId);
      if (s.ledger.has(key) || app.credit_refunded_at) {
        return { refunded: false, ledgerId: app.credit_refund_ledger_id };
      }
      const ledgerId = `ledger-${key}`;
      s.ledger.set(key, {
        id: ledgerId,
        profile_id: app.applicant_id,
        application_id: app.id,
        entry_type: "refund_no_reply",
        amount: 1,
        idempotency_key: key,
        created_at: at.toISOString(),
      });
      const bal = s.creditsByProfile.get(app.applicant_id) ?? 0;
      s.creditsByProfile.set(app.applicant_id, bal + 1);
      app.credit_refunded_at = at.toISOString();
      app.credit_refund_ledger_id = ledgerId;
      app.awaiting_customer_response = false;
      s.applications.set(app.id, app);
      s.notifications.push({
        profile_id: app.applicant_id,
        title: "Application credit returned",
        body: "The customer did not respond within 72 hours. 1 application credit was returned.",
        created_at: at.toISOString(),
      });
      return { refunded: true, ledgerId };
    },

    markReminderSent(applicationId: string, at = new Date()) {
      const app = s.applications.get(applicationId);
      if (!app || app.customer_deadline_reminder_sent_at) return false;
      app.customer_deadline_reminder_sent_at = at.toISOString();
      s.applications.set(app.id, app);
      s.notifications.push({
        profile_id: "customer",
        title: "Respond before the deadline",
        body: "Viewing alone is not enough — message, accept, or decline.",
        created_at: at.toISOString(),
      });
      return true;
    },

    reset() {
      s.applications.clear();
      s.ledger.clear();
      s.creditsByProfile.clear();
      s.creditsByProfile.set(DEMO_PROFILE_ID, 2);
      s.notifications.length = 0;
    },

    notifications() {
      return [...s.notifications];
    },

    ledgerEntries() {
      return [...s.ledger.values()];
    },
  };
}
