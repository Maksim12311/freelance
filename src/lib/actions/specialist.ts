"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireVerifiedStudent } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { trackAnalyticsEvent } from "@/lib/analytics";
import {
  createStripeCheckoutSession,
  hasActiveBoost,
  hasActivePlus,
} from "@/lib/payments";
import { getPricingSetting } from "@/lib/pricing";
import type { ActionResult } from "@/lib/actions/auth";
import { z } from "zod";

const specialistProfileSchema = z.object({
  specialistHeadline: z.string().trim().max(120).optional().or(z.literal("")),
  specialistBio: z.string().trim().max(3000).optional().or(z.literal("")),
  preferredBudgetMinEur: z.preprocess((v) => {
    if (v === "" || v == null) return null;
    return v;
  }, z.coerce.number().min(0).max(100_000).nullable()),
  preferredBudgetMaxEur: z.preprocess((v) => {
    if (v === "" || v == null) return null;
    return v;
  }, z.coerce.number().min(0).max(100_000).nullable()),
  remoteAvailable: z.boolean(),
  acceptsInvitations: z.boolean(),
  availability: z.string().trim().max(500).optional().or(z.literal("")),
  skillIds: z.array(z.uuid()).max(30).optional(),
});

export async function updateSpecialistProfileAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const profile = await requireVerifiedStudent();
  const skillIds = formData.getAll("skillIds").map(String).filter(Boolean);

  const parsed = specialistProfileSchema.safeParse({
    specialistHeadline: formData.get("specialistHeadline") || "",
    specialistBio: formData.get("specialistBio") || "",
    preferredBudgetMinEur: formData.get("preferredBudgetMinEur"),
    preferredBudgetMaxEur: formData.get("preferredBudgetMaxEur"),
    remoteAvailable: formData.has("remoteAvailable"),
    acceptsInvitations: formData.has("acceptsInvitations"),
    availability: formData.get("availability") || "",
    skillIds,
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  if (
    parsed.data.preferredBudgetMinEur != null &&
    parsed.data.preferredBudgetMaxEur != null &&
    parsed.data.preferredBudgetMinEur > parsed.data.preferredBudgetMaxEur
  ) {
    return { ok: false, error: "Minimum budget cannot exceed maximum budget." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      is_specialist_enabled: true,
      active_mode: "specialist",
      specialist_headline: parsed.data.specialistHeadline || null,
      specialist_bio: parsed.data.specialistBio || null,
      preferred_budget_min_eur: parsed.data.preferredBudgetMinEur,
      preferred_budget_max_eur: parsed.data.preferredBudgetMaxEur,
      remote_available: parsed.data.remoteAvailable,
      accepts_invitations: parsed.data.acceptsInvitations,
      availability: parsed.data.availability || null,
    })
    .eq("id", profile.id);

  if (error) return { ok: false, error: error.message };

  if (parsed.data.skillIds) {
    await supabase.from("profile_skills").delete().eq("profile_id", profile.id);
    if (parsed.data.skillIds.length) {
      await supabase.from("profile_skills").insert(
        parsed.data.skillIds.map((skillId) => ({
          profile_id: profile.id,
          skill_id: skillId,
        })),
      );
    }
  }

  revalidatePath("/dashboard/specialist");
  revalidatePath("/settings");
  return { ok: true, message: "Specialist profile updated" };
}

const portfolioSchema = z.object({
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  imageUrl: z.string().trim().url().optional().or(z.literal("")),
  linkUrl: z.string().trim().url().optional().or(z.literal("")),
});

export async function addPortfolioItemAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const profile = await requireVerifiedStudent();
  const parsed = portfolioSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || "",
    imageUrl: formData.get("imageUrl") || "",
    linkUrl: formData.get("linkUrl") || "",
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("portfolio_items").insert({
    profile_id: profile.id,
    title: parsed.data.title,
    description: parsed.data.description || null,
    image_url: parsed.data.imageUrl || null,
    link_url: parsed.data.linkUrl || null,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard/specialist");
  return { ok: true, message: "Portfolio item added" };
}

export async function deletePortfolioItemAction(itemId: string): Promise<ActionResult> {
  const profile = await requireVerifiedStudent();
  const supabase = await createClient();
  const { error } = await supabase
    .from("portfolio_items")
    .delete()
    .eq("id", itemId)
    .eq("profile_id", profile.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard/specialist");
  return { ok: true };
}

export async function purchaseProfileBoostAction(): Promise<ActionResult> {
  const profile = await requireVerifiedStudent();
  if (await hasActiveBoost(profile.id)) {
    return { ok: false, error: "You already have an active profile boost." };
  }

  const pricing = await getPricingSetting("profile_boost_7d");
  if (!pricing.is_enabled) {
    return { ok: false, error: "Profile boosts are currently disabled." };
  }

  const durationDays = Number(pricing.metadata.duration_days ?? 7);
  const startsAt = new Date();
  const endsAt = new Date(startsAt.getTime() + durationDays * 24 * 60 * 60 * 1000);
  const supabase = await createClient();

  if (process.env.STRIPE_SECRET_KEY) {
    const { data: boost, error } = await supabase
      .from("profile_boosts")
      .insert({
        profile_id: profile.id,
        starts_at: startsAt.toISOString(),
        ends_at: endsAt.toISOString(),
        amount_eur: pricing.amount_eur,
        payment_provider: "stripe",
        status: "pending",
      })
      .select("id")
      .single();
    if (error || !boost) return { ok: false, error: error?.message ?? "Could not start boost" };

    const checkout = await createStripeCheckoutSession({
      amountEur: pricing.amount_eur,
      purpose: "profile_boost_7d",
      paymentId: boost.id,
      profileId: profile.id,
      successPath: `/dashboard/specialist?boost=1`,
      cancelPath: `/dashboard/specialist?boost_cancelled=1`,
    });
    if (!checkout.ok) return checkout;
    await supabase
      .from("profile_boosts")
      .update({ payment_reference: checkout.sessionId })
      .eq("id", boost.id);
    redirect(checkout.url);
  }

  const reference = `manual_boost_${Date.now()}`;
  const { error } = await supabase.from("profile_boosts").insert({
    profile_id: profile.id,
    starts_at: startsAt.toISOString(),
    ends_at: endsAt.toISOString(),
    amount_eur: pricing.amount_eur,
    payment_provider: "manual",
    payment_reference: reference,
    status: "active",
  });
  if (error) return { ok: false, error: error.message };

  await trackAnalyticsEvent({
    eventType: "boost_purchase",
    actorId: profile.id,
    subjectProfileId: profile.id,
    metadata: { amount_eur: pricing.amount_eur, ends_at: endsAt.toISOString() },
  });

  revalidatePath("/dashboard/specialist");
  return {
    ok: true,
    message: `Profile boost active until ${endsAt.toLocaleDateString("de-AT")} (€${pricing.amount_eur.toFixed(2)})`,
  };
}

export async function subscribePlusAction(): Promise<ActionResult> {
  const profile = await requireVerifiedStudent();
  if (await hasActivePlus(profile.id)) {
    return { ok: false, error: "You already have an active StudentPro Plus subscription." };
  }

  const pricing = await getPricingSetting("plus_monthly");
  if (!pricing.is_enabled) {
    return { ok: false, error: "StudentPro Plus is currently unavailable." };
  }

  const supabase = await createClient();
  const { data: plan } = await supabase
    .from("subscription_plans")
    .select("id, amount_eur")
    .eq("code", "plus_monthly")
    .eq("is_active", true)
    .maybeSingle();

  if (!plan) return { ok: false, error: "Plus plan not found. Run database migrations." };

  const periodStart = new Date();
  const periodEnd = new Date(periodStart);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  if (process.env.STRIPE_SECRET_KEY) {
    // Record pending sub, redirect to Stripe; webhook activates.
    const { data: sub, error } = await supabase
      .from("user_subscriptions")
      .insert({
        profile_id: profile.id,
        plan_id: plan.id,
        status: "past_due",
        current_period_start: periodStart.toISOString(),
        current_period_end: periodEnd.toISOString(),
        payment_provider: "stripe",
      })
      .select("id")
      .single();
    if (error || !sub) return { ok: false, error: error?.message ?? "Could not start subscription" };

    const checkout = await createStripeCheckoutSession({
      amountEur: Number(plan.amount_eur),
      purpose: "plus_monthly",
      paymentId: sub.id,
      profileId: profile.id,
      successPath: `/dashboard/specialist?plus=1`,
      cancelPath: `/dashboard/specialist?plus_cancelled=1`,
    });
    if (!checkout.ok) return checkout;
    await supabase
      .from("user_subscriptions")
      .update({ payment_reference: checkout.sessionId })
      .eq("id", sub.id);
    redirect(checkout.url);
  }

  const { error } = await supabase.from("user_subscriptions").insert({
    profile_id: profile.id,
    plan_id: plan.id,
    status: "active",
    current_period_start: periodStart.toISOString(),
    current_period_end: periodEnd.toISOString(),
    payment_provider: "manual",
    payment_reference: `manual_plus_${Date.now()}`,
  });
  if (error) return { ok: false, error: error.message };

  await trackAnalyticsEvent({
    eventType: "plus_subscribe",
    actorId: profile.id,
    subjectProfileId: profile.id,
    metadata: { period_end: periodEnd.toISOString() },
  });

  revalidatePath("/dashboard/specialist");
  revalidatePath("/dashboard/analytics");
  return {
    ok: true,
    message: `StudentPro Plus active until ${periodEnd.toLocaleDateString("de-AT")}. Applications remain charged separately.`,
  };
}

export async function cancelPlusAction(): Promise<ActionResult> {
  const profile = await requireVerifiedStudent();
  const supabase = await createClient();
  const now = new Date().toISOString();

  const { data: sub } = await supabase
    .from("user_subscriptions")
    .select("id")
    .eq("profile_id", profile.id)
    .in("status", ["active", "trialing"])
    .gt("current_period_end", now)
    .order("current_period_end", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!sub) return { ok: false, error: "No active subscription to cancel." };

  const { error } = await supabase
    .from("user_subscriptions")
    .update({
      cancel_at_period_end: true,
      cancelled_at: now,
    })
    .eq("id", sub.id);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard/specialist");
  return {
    ok: true,
    message: "Plus will cancel at the end of the current billing period.",
  };
}
