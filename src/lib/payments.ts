import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripeConfigured } from "@/lib/pricing";

export type PaymentResult =
  | { ok: true; method: "credit"; creditId: string; paymentId: string }
  | { ok: true; method: "manual"; paymentId: string; reference: string }
  | { ok: true; method: "prior"; paymentId: string }
  | { ok: true; method: "stripe"; paymentId: string; checkoutUrl: string }
  | { ok: false; error: string };

async function getAdminOrUserClient() {
  try {
    return createAdminClient();
  } catch {
    return createClient();
  }
}

/** Consume one application credit if available. */
export async function consumeApplicationCredit(profileId: string): Promise<string | null> {
  const supabase = await createClient();
  const now = new Date().toISOString();
  const { data: credits } = await supabase
    .from("application_credits")
    .select("id, remaining, expires_at")
    .eq("profile_id", profileId)
    .gt("remaining", 0)
    .order("expires_at", { ascending: true, nullsFirst: false })
    .limit(10);

  const credit = (credits ?? []).find(
    (c) => !c.expires_at || c.expires_at > now,
  );
  if (!credit) return null;

  const { error } = await supabase
    .from("application_credits")
    .update({ remaining: credit.remaining - 1 })
    .eq("id", credit.id)
    .eq("remaining", credit.remaining);

  if (error) return null;

  // Immutable ledger entry for the consume (best-effort; unique per credit use).
  try {
    await supabase.from("application_credit_ledger").insert({
      profile_id: profileId,
      credit_id: credit.id,
      entry_type: "consume",
      amount: -1,
      balance_after: credit.remaining - 1,
      idempotency_key: `consume:${credit.id}:${credit.remaining}`,
      note: "Application credit consumed",
      metadata: {},
    });
  } catch {
    // Ledger table may not exist yet in older environments.
  }

  return credit.id;
}

export async function countApplicationCredits(profileId: string): Promise<number> {
  const supabase = await createClient();
  const now = new Date().toISOString();
  const { data } = await supabase
    .from("application_credits")
    .select("remaining, expires_at")
    .eq("profile_id", profileId)
    .gt("remaining", 0);
  return (data ?? [])
    .filter((c) => !c.expires_at || c.expires_at > now)
    .reduce((sum, c) => sum + c.remaining, 0);
}

/**
 * Settle application fee: credit → Stripe checkout (if configured) → manual demo payment.
 * Never charges twice for the same (profile, request) pair (unique constraint).
 */
export async function settleApplicationFee(input: {
  profileId: string;
  requestId: string;
  amountEur: number;
  preferCredit?: boolean;
}): Promise<PaymentResult> {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("application_payments")
    .select("id, status, payment_provider")
    .eq("profile_id", input.profileId)
    .eq("request_id", input.requestId)
    .maybeSingle();

  if (existing?.status === "succeeded") {
    return { ok: true, method: "prior", paymentId: existing.id };
  }

  // Try credit first when preferred or when Stripe is not configured.
  if (input.preferCredit !== false) {
    const creditId = await consumeApplicationCredit(input.profileId);
    if (creditId) {
      const { data: payment, error } = await supabase
        .from("application_payments")
        .upsert(
          {
            profile_id: input.profileId,
            request_id: input.requestId,
            amount_eur: input.amountEur,
            currency: "EUR",
            status: "succeeded",
            payment_provider: "credit",
            provider_payment_id: creditId,
            metadata: { credit_id: creditId },
          },
          { onConflict: "profile_id,request_id" },
        )
        .select("id")
        .single();

      if (error || !payment) {
        return { ok: false, error: error?.message ?? "Could not record credit payment" };
      }
      return { ok: true, method: "credit", creditId, paymentId: payment.id };
    }
  }

  if (stripeConfigured()) {
    const { data: payment, error } = await supabase
      .from("application_payments")
      .upsert(
        {
          profile_id: input.profileId,
          request_id: input.requestId,
          amount_eur: input.amountEur,
          currency: "EUR",
          status: "pending",
          payment_provider: "stripe",
          metadata: { purpose: "application_fee" },
        },
        { onConflict: "profile_id,request_id" },
      )
      .select("id")
      .single();

    if (error || !payment) {
      return { ok: false, error: error?.message ?? "Could not create payment" };
    }

    const checkout = await createStripeCheckoutSession({
      amountEur: input.amountEur,
      purpose: "application_fee",
      paymentId: payment.id,
      profileId: input.profileId,
      requestId: input.requestId,
      successPath: `/requests/${input.requestId}?paid=1`,
      cancelPath: `/requests/${input.requestId}?cancelled=1`,
    });

    if (!checkout.ok) return checkout;
    await supabase
      .from("application_payments")
      .update({ provider_payment_id: checkout.sessionId })
      .eq("id", payment.id);

    return {
      ok: true,
      method: "stripe",
      paymentId: payment.id,
      checkoutUrl: checkout.url,
    };
  }

  // Demo / local: manual succeeded payment (server-side recorded event).
  const reference = `manual_${Date.now()}_${input.requestId.slice(0, 8)}`;
  const { data: payment, error } = await supabase
    .from("application_payments")
    .upsert(
      {
        profile_id: input.profileId,
        request_id: input.requestId,
        amount_eur: input.amountEur,
        currency: "EUR",
        status: "succeeded",
        payment_provider: "manual",
        provider_payment_id: reference,
        provider_event_id: `evt_${reference}`,
        metadata: { note: "Local/manual settlement (Stripe not configured)" },
      },
      { onConflict: "profile_id,request_id" },
    )
    .select("id")
    .single();

  if (error || !payment) {
    return { ok: false, error: error?.message ?? "Could not record payment" };
  }

  return { ok: true, method: "manual", paymentId: payment.id, reference };
}

export async function createStripeCheckoutSession(input: {
  amountEur: number;
  purpose: string;
  paymentId: string;
  profileId: string;
  requestId?: string;
  successPath: string;
  cancelPath: string;
}): Promise<{ ok: true; url: string; sessionId: string } | { ok: false; error: string }> {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) return { ok: false, error: "Stripe is not configured" };

  const site = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const amountCents = Math.round(input.amountEur * 100);

  const body = new URLSearchParams();
  body.set("mode", "payment");
  body.set("success_url", `${site}${input.successPath}&session_id={CHECKOUT_SESSION_ID}`);
  body.set("cancel_url", `${site}${input.cancelPath}`);
  body.set("client_reference_id", input.paymentId);
  body.set("metadata[payment_id]", input.paymentId);
  body.set("metadata[purpose]", input.purpose);
  body.set("metadata[profile_id]", input.profileId);
  if (input.requestId) body.set("metadata[request_id]", input.requestId);
  body.set("line_items[0][quantity]", "1");
  body.set("line_items[0][price_data][currency]", "eur");
  body.set("line_items[0][price_data][unit_amount]", String(amountCents));
  body.set("line_items[0][price_data][product_data][name]", `StudentPro ${input.purpose}`);

  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const json = (await res.json()) as { id?: string; url?: string; error?: { message?: string } };
  if (!res.ok || !json.url || !json.id) {
    return { ok: false, error: json.error?.message ?? "Stripe checkout failed" };
  }
  return { ok: true, url: json.url, sessionId: json.id };
}

export async function markStripePaymentSucceeded(input: {
  paymentId: string;
  providerPaymentId: string;
  providerEventId: string;
}) {
  const client = await getAdminOrUserClient();
  const supabase = client as Awaited<ReturnType<typeof createClient>>;
  await supabase
    .from("application_payments")
    .update({
      status: "succeeded",
      provider_payment_id: input.providerPaymentId,
      provider_event_id: input.providerEventId,
    })
    .eq("id", input.paymentId);
}

export async function hasActiveBoost(profileId: string): Promise<boolean> {
  const supabase = await createClient();
  const now = new Date().toISOString();
  const { data } = await supabase
    .from("profile_boosts")
    .select("id")
    .eq("profile_id", profileId)
    .eq("status", "active")
    .lte("starts_at", now)
    .gt("ends_at", now)
    .limit(1)
    .maybeSingle();
  return Boolean(data);
}

export async function hasActivePlus(profileId: string): Promise<boolean> {
  const supabase = await createClient();
  const now = new Date().toISOString();
  const { data } = await supabase
    .from("user_subscriptions")
    .select("id")
    .eq("profile_id", profileId)
    .in("status", ["trialing", "active"])
    .gt("current_period_end", now)
    .limit(1)
    .maybeSingle();
  return Boolean(data);
}

export async function expireStaleBoosts() {
  try {
    const supabase = await createClient();
    const now = new Date().toISOString();
    await supabase
      .from("profile_boosts")
      .update({ status: "expired" })
      .eq("status", "active")
      .lte("ends_at", now);

    await supabase
      .from("user_subscriptions")
      .update({ status: "expired" })
      .in("status", ["active", "trialing", "past_due"])
      .lte("current_period_end", now)
      .eq("cancel_at_period_end", true);
  } catch {
    // best-effort
  }
}
