export { cn } from "cn";

import { format, formatDistanceToNow, isValid, parseISO } from "date-fns";

import { DEFAULT_CURRENCY } from "@/lib/constants";

const eurFormatter = new Intl.NumberFormat("de-AT", {
  style: "currency",
  currency: DEFAULT_CURRENCY,
  maximumFractionDigits: 2,
});

export function formatCurrency(
  amount: number | null | undefined,
  options?: { fallback?: string },
): string {
  if (amount == null || Number.isNaN(amount)) {
    return options?.fallback ?? "—";
  }
  return eurFormatter.format(amount);
}

/** Alias used by shared request cards. */
export function formatBudget(amount: number | null | undefined): string {
  return formatCurrency(amount, { fallback: "Budget TBD" });
}

function toDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  const date = typeof value === "string" ? parseISO(value) : value;
  return isValid(date) ? date : null;
}

export function formatDate(
  value: string | Date | null | undefined,
  pattern = "d MMM yyyy",
): string {
  const date = toDate(value);
  if (!date) return "—";
  return format(date, pattern);
}

export function formatDateTime(
  value: string | Date | null | undefined,
  pattern = "d MMM yyyy, HH:mm",
): string {
  return formatDate(value, pattern);
}

export function formatRelativeTime(
  value: string | Date | null | undefined,
): string {
  const date = toDate(value);
  if (!date) return "—";
  return formatDistanceToNow(date, { addSuffix: true });
}

/** Alias used by shared request cards. */
export function formatRelativeDate(
  value: string | Date | null | undefined,
): string {
  return formatRelativeTime(value);
}

export function truncate(value: string, max = 120): string {
  const trimmed = value.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, Math.max(max - 1, 1)).trimEnd()}…`;
}

export function getInitials(name: string, max = 2): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, max)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function absoluteUrl(path = "/"): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base.replace(/\/$/, "")}${normalized}`;
}
