import { createClient } from "@/lib/supabase/server";

export type PricingKey = "application_fee" | "profile_boost_7d" | "plus_monthly";

export type PricingSetting = {
  key: string;
  amount_eur: number;
  currency: string;
  description: string | null;
  is_enabled: boolean;
  metadata: Record<string, unknown>;
};

const FALLBACK: Record<PricingKey, PricingSetting> = {
  application_fee: {
    key: "application_fee",
    amount_eur: 1.99,
    currency: "EUR",
    description: "Standard specialist application fee",
    is_enabled: true,
    metadata: {},
  },
  profile_boost_7d: {
    key: "profile_boost_7d",
    amount_eur: 3.99,
    currency: "EUR",
    description: "Profile boost for 7 days",
    is_enabled: true,
    metadata: { duration_days: 7 },
  },
  plus_monthly: {
    key: "plus_monthly",
    amount_eur: 7.99,
    currency: "EUR",
    description: "StudentPro Plus monthly subscription",
    is_enabled: true,
    metadata: { interval: "month" },
  },
};

export async function getPricingSetting(key: PricingKey): Promise<PricingSetting> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("pricing_settings")
      .select("*")
      .eq("key", key)
      .maybeSingle();
    if (!data) return FALLBACK[key];
    return {
      key: data.key,
      amount_eur: Number(data.amount_eur),
      currency: data.currency,
      description: data.description,
      is_enabled: data.is_enabled,
      metadata: (data.metadata ?? {}) as Record<string, unknown>,
    };
  } catch {
    return FALLBACK[key];
  }
}

export async function getAllPricingSettings(): Promise<PricingSetting[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("pricing_settings").select("*").order("key");
    if (!data?.length) return Object.values(FALLBACK);
    return data.map((row) => ({
      key: row.key,
      amount_eur: Number(row.amount_eur),
      currency: row.currency,
      description: row.description,
      is_enabled: row.is_enabled,
      metadata: (row.metadata ?? {}) as Record<string, unknown>,
    }));
  } catch {
    return Object.values(FALLBACK);
  }
}

export function formatEur(amount: number) {
  return new Intl.NumberFormat("de-AT", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

export function stripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}
