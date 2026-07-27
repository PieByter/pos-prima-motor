"use client";

import {
  DollarSign,
  ShoppingBag,
  Package,
  Users,
  TrendingUp,
  TrendingDown,
  Plus,
  Receipt,
} from "lucide-react";
import { useFetch } from "@/lib/hooks/use-fetch";
import { formatCurrency, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

interface SummaryData {
  totalSales: number;
  totalPurchases: number;
  totalItems: number;
  totalCustomers: number;
  totalExpenses: number;
  salesGrowth: number;
  purchasesGrowth: number;
}

const colorMap = {
  sky: {
    accent: "bg-sky-500",
    iconBg: "bg-sky-50 dark:bg-sky-500/10",
    iconText: "text-sky-600 dark:text-sky-300",
  },
  orange: {
    accent: "bg-orange-500",
    iconBg: "bg-orange-50 dark:bg-orange-500/10",
    iconText: "text-orange-600 dark:text-orange-300",
  },
  violet: {
    accent: "bg-violet-500",
    iconBg: "bg-violet-50 dark:bg-violet-500/10",
    iconText: "text-violet-600 dark:text-violet-300",
  },
  emerald: {
    accent: "bg-emerald-500",
    iconBg: "bg-emerald-50 dark:bg-emerald-500/10",
    iconText: "text-emerald-600 dark:text-emerald-300",
  },
  rose: {
    accent: "bg-rose-500",
    iconBg: "bg-rose-50 dark:bg-rose-500/10",
    iconText: "text-rose-600 dark:text-rose-300",
  },
} as const;

const TrendIcon = {
  up: TrendingUp,
  down: TrendingDown,
  add: Plus,
};

export function SummaryCards() {
  const { data, isLoading } = useFetch<SummaryData>("/api/dashboard/summary");

  const stats = [
    {
      key: "totalSales" as const,
      label: "Total Sales",
      format: formatCurrency,
      value: data?.totalSales ?? 0,
      growth: data?.salesGrowth ?? null,
      icon: DollarSign,
      color: "sky" as const,
    },
    {
      key: "totalPurchases" as const,
      label: "Total Purchases",
      format: formatCurrency,
      value: data?.totalPurchases ?? 0,
      growth: data?.purchasesGrowth ?? null,
      icon: ShoppingBag,
      color: "orange" as const,
    },
    {
      key: "totalItems" as const,
      label: "Inventory Items",
      format: (v: number) => formatNumber(v),
      value: data?.totalItems ?? 0,
      growth: null,
      icon: Package,
      color: "violet" as const,
    },
    {
      key: "totalCustomers" as const,
      label: "Active Customers",
      format: (v: number) => formatNumber(v),
      value: data?.totalCustomers ?? 0,
      growth: null,
      icon: Users,
      color: "emerald" as const,
    },
    {
      key: "totalExpenses" as const,
      label: "Expenses",
      format: formatCurrency,
      value: data?.totalExpenses ?? 0,
      growth: null,
      icon: Receipt,
      color: "rose" as const,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {stats.map((stat) => {
        const palette = colorMap[stat.color];
        const formatted = stat.format(stat.value);

        return (
          <div
            key={stat.key}
            className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md dark:border-slate-700 dark:bg-slate-800"
          >
            {/* Accent bar */}
            <span
              className={cn(
                "absolute inset-x-0 top-0 h-0.5",
                palette.accent,
              )}
            />

            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                  {stat.label}
                </p>
                {isLoading ? (
                  <div className="h-7 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                ) : (
                  <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                    {formatted}
                  </p>
                )}
              </div>
              <div
                className={cn(
                  "flex size-9 items-center justify-center rounded-lg",
                  palette.iconBg,
                  palette.iconText,
                )}
              >
                <stat.icon className="h-5 w-5" />
              </div>
            </div>

            {/* Growth indicator */}
            {stat.growth !== null && !isLoading && (
              <div className="mt-3 flex items-center gap-1.5 text-xs">
                {stat.growth >= 0 ? (
                  <>
                    <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                    <span className="font-medium text-emerald-600 dark:text-emerald-400">
                      {stat.growth}%
                    </span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="h-3.5 w-3.5 text-red-500" />
                    <span className="font-medium text-red-600 dark:text-red-400">
                      {stat.growth}%
                    </span>
                  </>
                )}
                <span className="text-slate-400 dark:text-slate-500">
                  vs last month
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
