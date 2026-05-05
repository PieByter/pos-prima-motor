"use client";

import { Droplets } from "lucide-react";
import { useFetch } from "@/lib/hooks/use-fetch";
import { formatCurrency } from "@/lib/format";
import {
  DashboardCard,
  SectionHeader,
  EmptyState,
  LoadingSpinner,
} from "./ui/dashboard-card";

interface TopItemRaw {
  item_id: number;
  name: string;
  total_revenue: number;
}

export function TopSellingItems() {
  const { data: rawItems, isLoading } = useFetch<TopItemRaw[]>(
    "/api/dashboard/top-items",
  );

  const items = (rawItems ?? []).map((row) => ({
    id: row.item_id,
    name: row.name,
    amount: Number(row.total_revenue ?? 0),
  }));

  return (
    <DashboardCard className="flex flex-col">
      <SectionHeader label="Performance" title="Top Selling Items" />

      <div className="flex-1 space-y-2.5 px-4 py-4">
        {isLoading ? (
          <LoadingSpinner />
        ) : items.length === 0 ? (
          <EmptyState message="Belum ada data penjualan teratas." />
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/50 px-3 py-2.5 transition-colors hover:bg-slate-100/60 dark:border-slate-800/50 dark:bg-slate-800/30 dark:hover:bg-slate-800/50"
            >
              <div className="rounded-lg bg-sky-50 p-2 text-sky-600 dark:bg-sky-500/10 dark:text-sky-300">
                <Droplets className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="truncate text-sm font-semibold text-slate-700 dark:text-slate-200">
                  {item.name}
                </h4>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  Sparepart
                </p>
              </div>
              <span className="whitespace-nowrap text-sm font-bold text-slate-700 dark:text-slate-200">
                {formatCurrency(item.amount)}
              </span>
            </div>
          ))
        )}
      </div>

      <button className="w-full border-t border-slate-100 py-3 text-xs font-semibold text-sky-600 transition-colors hover:bg-sky-50/50 dark:border-slate-800/60 dark:text-sky-400 dark:hover:bg-sky-900/20">
        View All Items
      </button>
    </DashboardCard>
  );
}
