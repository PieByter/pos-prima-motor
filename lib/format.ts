/**
 * Shared formatting utilities for the POS dashboard.
 * Centralizes currency and number formatting so every component stays consistent.
 */

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value ?? 0);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("id-ID").format(value ?? 0);
}

export function formatCompactCurrency(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return value.toString();
}
