import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { trackAnalyticsEvent } from "@/lib/analytics";

export const runtime = "nodejs";

/**
 * Verifies Stripe webhook events server-side and activates paid products.
 * Requires STRIPE_SECRET_KEY + STRIPE_WEBHOOK_SECRET.
 */
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!secret || !stripeKey) {
    return NextResponse.json({ error: "Stripe webhook not configured" }, { status: 503 });
  }

  const payload = await request.text();
  const signature = request.headers.get("stripe-signature") || "";

  // Lightweight signature check via Stripe API event retrieve is preferred when
  // the stripe SDK is not installed. We verify the event id from the payload
  // against Stripe's servers before mutating state.
  let event: {
    id: string;
    type: string;
    data: { object: Record<string, unknown> };
  };

  try {
    event = JSON.parse(payload) as typeof event;
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  if (!event?.id || !signature) {
    return NextResponse.json({ error: "Missing event or signature" }, { status: 400 });
  }

  // Confirm event exists with Stripe (server-side verification).
  const verify = await fetch(`https://api.stripe.com/v1/events/${event.id}`, {
    headers: { Authorization: `Bearer ${stripeKey}` },
  });
  if (!verify.ok) {
    return NextResponse.json({ error: "Unverified Stripe event" }, { status: 400 });
  }
  const verified = (await verify.json()) as typeof event;
  event = verified;

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object;
  const metadata = (session.metadata ?? {}) as Record<string, string>;
  const purpose = metadata.purpose;
  const paymentId = metadata.payment_id;
  const profileId = metadata.profile_id;
  const requestId = metadata.request_id;
  const providerPaymentId = String(session.id ?? "");

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json({ error: "Admin client unavailable" }, { status: 500 });
  }

  if (purpose === "application_fee" && paymentId && profileId && requestId) {
    await admin
      .from("application_payments")
      .update({
        status: "succeeded",
        provider_payment_id: providerPaymentId,
        provider_event_id: event.id,
      })
      .eq("id", paymentId);

    const { data: payment } = await admin
      .from("application_payments")
      .select("metadata, amount_eur")
      .eq("id", paymentId)
      .maybeSingle();

    const pending = (payment?.metadata as { pending_application?: Record<string, unknown> } | null)
      ?.pending_application;

    if (pending) {
      const { data: existing } = await admin
        .from("applications")
        .select("id")
        .eq("request_id", requestId)
        .eq("applicant_id", profileId)
        .maybeSingle();

      if (!existing) {
        const now = new Date().toISOString();
        const { data: application } = await admin
          .from("applications")
          .insert({
            request_id: requestId,
            applicant_id: profileId,
            introduction: String(pending.introduction ?? "Application submitted after payment."),
            experience: (pending.experience as string | null) ?? null,
            proposed_price_eur: (pending.proposed_price_eur as number | null) ?? null,
            availability: (pending.availability as string | null) ?? null,
            status: "sent",
            invitation_id: (pending.invitation_id as string | null) ?? null,
            payment_id: paymentId,
            fee_eur: payment?.amount_eur ?? null,
            messaging_unlocked: true,
            unlocked_at: now,
          })
          .select("id")
          .single();

        if (application) {
          await admin
            .from("application_payments")
            .update({ application_id: application.id })
            .eq("id", paymentId);

          const { data: request } = await admin
            .from("requests")
            .select("owner_id, title")
            .eq("id", requestId)
            .maybeSingle();

          if (request) {
            const { data: conversation } = await admin
              .from("conversations")
              .insert({ created_by: profileId, request_id: requestId })
              .select("id")
              .single();
            if (conversation) {
              await admin.from("conversation_participants").insert([
                { conversation_id: conversation.id, profile_id: profileId },
                { conversation_id: conversation.id, profile_id: request.owner_id },
              ]);
            }
            await admin.from("notifications").insert({
              profile_id: request.owner_id,
              type: "application",
              title: "New application received",
              body: `A specialist applied to “${request.title}” after payment.`,
              link_path: `/requests/${requestId}`,
            });
          }

          await trackAnalyticsEvent({
            eventType: "application_sent",
            actorId: profileId,
            subjectProfileId: profileId,
            requestId,
            applicationId: application.id,
            metadata: { via: "stripe_webhook" },
          });
        }
      }
    }
  }

  if (purpose === "profile_boost_7d" && paymentId) {
    await admin
      .from("profile_boosts")
      .update({
        status: "active",
        payment_reference: providerPaymentId,
      })
      .eq("id", paymentId);

    if (profileId) {
      await trackAnalyticsEvent({
        eventType: "boost_purchase",
        actorId: profileId,
        subjectProfileId: profileId,
        metadata: { via: "stripe_webhook" },
      });
    }
  }

  if (purpose === "plus_monthly" && paymentId) {
    const periodStart = new Date();
    const periodEnd = new Date(periodStart);
    periodEnd.setMonth(periodEnd.getMonth() + 1);
    await admin
      .from("user_subscriptions")
      .update({
        status: "active",
        payment_reference: providerPaymentId,
        current_period_start: periodStart.toISOString(),
        current_period_end: periodEnd.toISOString(),
        cancel_at_period_end: false,
      })
      .eq("id", paymentId);

    if (profileId) {
      await trackAnalyticsEvent({
        eventType: "plus_subscribe",
        actorId: profileId,
        subjectProfileId: profileId,
        metadata: { via: "stripe_webhook" },
      });
    }
  }

  return NextResponse.json({ received: true });
}
