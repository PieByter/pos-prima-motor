"use client";

import { Calendar, ShoppingCart, DollarSign, TrendingUp } from "lucide-react";
import { useFetch } from "@/lib/hooks/use-fetch";
import { formatCurrency } from "@/lib/format";

interface TodaySummary {
  transactionCount: number;
  totalSales: number;
  totalItems: number;
  lowStockCount: number;
}

export function TodaySummary() {
  const { data, isLoading } = useFetch<TodaySummary>("/api/dashboard/today");

  return (
    <div className="rounded-xl border border-sky-200 bg-linear-to-br from-sky-50 to-white p-3.5 shadow-sm dark:border-sky-800 dark:from-sky-900/30 dark:to-slate-800">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-sky-500 dark:text-sky-400">
        Ringkasan Hari Ini
      </p>
      {isLoading ? (
        <div className="mt-2 flex gap-3">
          <div className="h-8 w-20 animate-pulse rounded bg-sky-200/50 dark:bg-sky-700/50" />
          <div className="h-8 w-24 animate-pulse rounded bg-sky-200/50 dark:bg-sky-700/50" />
        </div>
      ) : (
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="flex items-center gap-1 text-sm font-semibold text-slate-900 dark:text-white">
            <ShoppingCart className="h-3.5 w-3.5 text-sky-500" />
            {data?.transactionCount ?? 0} transaksi
          </span>
          <span className="flex items-center gap-1 text-sm font-semibold text-slate-900 dark:text-white">
            <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
            {formatCurrency(data?.totalSales ?? 0)}
          </span>
          {data && data.lowStockCount > 0 && (
            <span className="flex items-center gap-1 text-xs font-medium text-amber-600">
              <TrendingUp className="h-3 w-3" />
              {data.lowStockCount} item kritis
            </span>
          )}
        </div>
      )}
    </div>
  );
}
