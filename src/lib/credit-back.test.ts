import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";
import {
  computeResponseDeadline,
  formatCountdown,
  getCreditBackStatus,
  isCustomerResponseKind,
  isDueForCustomerReminder,
  isEligibleForNoReplyCreditBack,
  noReplyRefundIdempotencyKey,
} from "@/lib/credit-back";
import { getDemoCreditBackStore } from "@/lib/demo-credit-back";
import { runNoReplyCreditBackJob } from "@/lib/credit-back-job";

describe("credit-back helpers", () => {
  it("computes a 72h deadline from unlock time", () => {
    const start = new Date("2026-11-02T10:00:00.000Z");
    const deadline = computeResponseDeadline(start, 72);
    assert.equal(deadline.toISOString(), "2026-11-05T10:00:00.000Z");
  });

  it("treats only message/accept/reject as responses", () => {
    assert.equal(isCustomerResponseKind("message"), true);
    assert.equal(isCustomerResponseKind("accept"), true);
    assert.equal(isCustomerResponseKind("reject"), true);
    assert.equal(isCustomerResponseKind("viewed"), false);
    assert.equal(isCustomerResponseKind("sent"), false);
  });

  it("builds a stable idempotency key", () => {
    assert.equal(
      noReplyRefundIdempotencyKey("app-1"),
      "no_reply_refund:app-1",
    );
  });

  it("formats countdown labels", () => {
    const now = new Date("2026-11-02T12:00:00.000Z");
    const label = formatCountdown("2026-11-03T14:30:00.000Z", now);
    assert.equal(label.expired, false);
    assert.match(label.label, /1d|26h|25h/);
  });

  it("marks eligibility only after deadline with no response", () => {
    const base = {
      awaiting_customer_response: true,
      customer_responded_at: null,
      credit_refunded_at: null,
      response_deadline_at: "2026-11-01T00:00:00.000Z",
      credit_id: "c1",
      fee_eur: 1.99,
    };
    assert.equal(isEligibleForNoReplyCreditBack(base, new Date("2026-11-02T00:00:00.000Z")), true);
    assert.equal(
      isEligibleForNoReplyCreditBack(
        { ...base, customer_responded_at: "2026-11-01T12:00:00.000Z" },
        new Date("2026-11-02T00:00:00.000Z"),
      ),
      false,
    );
    assert.equal(
      isEligibleForNoReplyCreditBack(
        { ...base, response_deadline_at: "2026-11-10T00:00:00.000Z" },
        new Date("2026-11-02T00:00:00.000Z"),
      ),
      false,
    );
  });

  it("schedules customer reminders in the final window", () => {
    const app = {
      awaiting_customer_response: true,
      customer_responded_at: null,
      credit_refunded_at: null,
      customer_deadline_reminder_sent_at: null,
      response_deadline_at: "2026-11-03T12:00:00.000Z",
    };
    assert.equal(
      isDueForCustomerReminder(app, new Date("2026-11-02T13:00:00.000Z"), 24),
      true,
    );
    assert.equal(
      isDueForCustomerReminder(app, new Date("2026-11-01T10:00:00.000Z"), 24),
      false,
    );
  });

  it("maps status for dashboards", () => {
    assert.equal(
      getCreditBackStatus({
        awaiting_customer_response: true,
        customer_responded_at: null,
        customer_response_kind: null,
        credit_refunded_at: null,
        response_deadline_at: "2099-01-01T00:00:00.000Z",
        credit_id: "c1",
        fee_eur: 1.99,
      }),
      "awaiting_response",
    );
    assert.equal(
      getCreditBackStatus({
        awaiting_customer_response: false,
        customer_responded_at: null,
        customer_response_kind: null,
        credit_refunded_at: "2026-11-02T00:00:00.000Z",
        response_deadline_at: "2026-11-01T00:00:00.000Z",
        credit_id: "c1",
        fee_eur: 1.99,
      }),
      "credit_returned",
    );
  });
});

describe("demo credit-back store + job", () => {
  beforeEach(() => {
    getDemoCreditBackStore().reset();
  });

  it("refunds exactly once after the deadline", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "";

    const store = getDemoCreditBackStore();
    const unlockedAt = new Date("2026-10-01T00:00:00.000Z");
    const app = store.createPaidApplication({
      id: "app-deadline",
      applicantId: "22222222-2222-4222-8222-222222222201",
      requestId: "44444444-4444-4444-8444-444444444401",
      unlockedAt,
      windowHours: 72,
    });

    const before = store.creditBalance("22222222-2222-4222-8222-222222222201");
    assert.ok(app.awaiting_customer_response);
    assert.equal(before, 1); // started at 2, consumed 1

    const first = await runNoReplyCreditBackJob(new Date("2026-10-05T00:00:00.000Z"));
    assert.equal(first.mode, "demo");
    assert.equal(first.refunded, 1);
    assert.equal(store.creditBalance("22222222-2222-4222-8222-222222222201"), 2);

    const second = await runNoReplyCreditBackJob(new Date("2026-10-06T00:00:00.000Z"));
    assert.equal(second.refunded, 0);
    assert.equal(store.ledgerEntries().filter((e) => e.entry_type === "refund_no_reply").length, 1);
  });

  it("does not refund after an accept response", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "";
    const store = getDemoCreditBackStore();
    const app = store.createPaidApplication({
      id: "app-accepted",
      applicantId: "22222222-2222-4222-8222-222222222201",
      requestId: "44444444-4444-4444-8444-444444444401",
      unlockedAt: new Date("2026-10-01T00:00:00.000Z"),
      windowHours: 72,
    });
    store.markCustomerResponse(app.id, "accept", new Date("2026-10-01T05:00:00.000Z"));
    const result = await runNoReplyCreditBackJob(new Date("2026-10-10T00:00:00.000Z"));
    assert.equal(result.refunded, 0);
    assert.equal(store.get(app.id)?.credit_refunded_at, null);
  });

  it("does not treat viewing as a response", () => {
    const store = getDemoCreditBackStore();
    const app = store.createPaidApplication({
      id: "app-viewed",
      applicantId: "22222222-2222-4222-8222-222222222201",
      requestId: "44444444-4444-4444-8444-444444444401",
      unlockedAt: new Date("2026-10-01T00:00:00.000Z"),
    });
    // Viewing only changes UI status elsewhere — store still awaits response.
    assert.equal(app.customer_responded_at, null);
    assert.equal(app.awaiting_customer_response, true);
    assert.equal(isCustomerResponseKind("viewed"), false);
  });
});
