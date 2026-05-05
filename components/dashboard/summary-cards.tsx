"use client";

import {
  DollarSign,
  ShoppingBag,
  Package,
  Users,
  TrendingUp,
  TrendingDown,
  Plus,
} from "lucide-react";
import { useFetch } from "@/lib/hooks/use-fetch";
import { formatCurrency, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

interface SummaryData {
  totalSales: number;
  totalPurchases: number;
  totalItems: number;
  totalCustomers: number;
}

const stats = [
  {
    key: "totalSales",
    label: "Total Sales",
    format: formatCurrency,
    change: "12.5%",
    trend: "up" as const,
    sub: "vs last month",
    icon: DollarSign,
    color: "sky",
  },
  {
    key: "totalPurchases",
    label: "Total Purchases",
    format: formatCurrency,
    change: "2.3%",
    trend: "down" as const,
    sub: "vs last month",
    icon: ShoppingBag,
    color: "orange",
  },
  {
    key: "totalItems",
    label: "Inventory Items",
    format: formatNumber,
    change: "84",
    trend: "add" as const,
    sub: "new items added",
    icon: Package,
    color: "violet",
  },
  {
    key: "totalCustomers",
    label: "Active Customers",
    format: formatNumber,
    change: "5.4%",
    trend: "up" as const,
    sub: "vs last month",
    icon: Users,
    color: "emerald",
  },
] as const;

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
} as const;

const TrendIcon = {
  up: TrendingUp,
  down: TrendingDown,
  add: Plus,
};

export function SummaryCards() {
  const { data, isLoading } = useFetch<SummaryData>("/api/dashboard/summary");

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => {
        const colors = colorMap[stat.color];
        const Icon = stat.icon;
        const Trend = TrendIcon[stat.trend];
        const value = data
          ? stat.format(data[stat.key as keyof SummaryData] as number)
          : "—";

        return (
          <div
            key={stat.label}
            className={cn(
              "group relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white/80 p-5 backdrop-blur-lg",
              "shadow-md shadow-slate-200/40 transition-all duration-200",
              "hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-200/50",
              "dark:border-slate-800/60 dark:bg-slate-900/60 dark:shadow-slate-950/30",
            )}
          >
            {/* Top accent bar */}
            <div className={cn("absolute inset-x-0 top-0 h-0.5", colors.accent)} />

            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                  {stat.label}
                </p>

                {isLoading ? (
                  <div className="mt-3 space-y-2.5 animate-pulse">
                    <div className="h-8 w-32 rounded-xl bg-slate-100 dark:bg-slate-800" />
                    <div className="h-3.5 w-24 rounded-full bg-slate-100 dark:bg-slate-800" />
                  </div>
                ) : (
                  <>
                    <h3 className="mt-2 text-2xl font-bold tracking-tight text-slate-800 dark:text-white">
                      {value}
                    </h3>
                    <div className="mt-2 flex items-center gap-1.5 text-xs">
                      <span
                        className={cn(
                          "flex items-center gap-1 font-semibold",
                          stat.trend === "down"
                            ? "text-rose-500"
                            : "text-emerald-500",
                        )}
                      >
                        <Trend className="h-3.5 w-3.5" />
                        {stat.change}
                      </span>
                      <span className="text-slate-400 dark:text-slate-500">
                        {stat.sub}
                      </span>
                    </div>
                  </>
                )}
              </div>

              <div className={cn("rounded-xl p-2.5", colors.iconBg)}>
                <Icon className={cn("h-4.5 w-4.5", colors.iconText)} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
