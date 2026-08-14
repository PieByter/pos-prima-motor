"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Loader, TrendingUp, TrendingDown } from "lucide-react";
import { formatRupiah } from "@/lib/data/items";

export type ItemProfitRow = {
  item_id: number;
  item_name: string;
  sku: string | null;
  quantity_sold: number;
  revenue: number;
  hpp: number;
  profit: number;
  margin_pct: number;
};

export function ItemProfitTable({ startDate, endDate }: { startDate: string; endDate: string }) {
  const [rows, setRows] = useState<ItemProfitRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sort, setSort] = useState<"profit" | "margin" | "qty">("profit");

  const load = useCallback(async () => {
    try {
      const query = `start_date=${startDate}&end_date=${endDate}`;
      const res = await fetch(`/api/reports/item-profit?${query}`, { cache: "no-store" });
      if (!res.ok) {
        if (res.status === 500) {
          setRows([]);
          return;
        }
        throw new Error("Gagal mengambil laporan");
      }
      setError(null);
      const json = (await res.json()) as ItemProfitRow[];
      setRows(Array.isArray(json) ? json : []);
    } catch (err) {
      console.error(err);
      setError("Tidak dapat memuat laporan laba per item.");
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(t);
  }, [load]);

  const sorted = [...rows].sort((a, b) => {
    if (sort === "qty") return b.quantity_sold - a.quantity_sold;
    if (sort === "margin") return b.margin_pct - a.margin_pct;
    return b.profit - a.profit;
  });

  const totalProfit = rows.reduce((s, r) => s + r.profit, 0);
  const totalRevenue = rows.reduce((s, r) => s + r.revenue, 0);
  const overallMargin = totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 1000) / 10 : 0;

  return (
    <div className="space-y-4">
      {/* Ringkasan */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border bg-white dark:bg-slate-800 p-4">
          <p className="text-xs text-slate-500">Total Laba</p>
          <p className={`text-lg font-bold ${totalProfit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600"}`}>
            {formatRupiah(totalProfit)}
          </p>
        </div>
        <div className="rounded-xl border bg-white dark:bg-slate-800 p-4">
          <p className="text-xs text-slate-500">Total Pendapatan</p>
          <p className="text-lg font-bold text-slate-900 dark:text-white">{formatRupiah(totalRevenue)}</p>
        </div>
        <div className="rounded-xl border bg-white dark:bg-slate-800 p-4">
          <p className="text-xs text-slate-500">Margin Rata-rata</p>
          <p className={`text-lg font-bold ${overallMargin >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600"}`}>
            {overallMargin}%
          </p>
        </div>
      </div>

      {/* Filter sort */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-slate-500">Urutkan:</span>
        <button
          onClick={() => setSort("profit")}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${sort === "profit" ? "bg-sky-500 text-white" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}
        >
          Laba Terbesar
        </button>
        <button
          onClick={() => setSort("margin")}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${sort === "margin" ? "bg-sky-500 text-white" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}
        >
          Margin Tertinggi
        </button>
        <button
          onClick={() => setSort("qty")}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${sort === "qty" ? "bg-sky-500 text-white" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}
        >
          Terlaris
        </button>
      </div>

      {/* Tabel */}
      <div className="rounded-xl border bg-white dark:bg-slate-800 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader className="h-7 w-7 animate-spin text-sky-500" />
          </div>
        ) : error ? (
          <p className="p-8 text-center text-sm text-red-500">{error}</p>
        ) : sorted.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-400">Belum ada penjualan pada periode ini.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-slate-50 dark:bg-slate-900/50">
                <tr className="text-left text-xs text-slate-500">
                  <th className="px-4 py-3">Item</th>
                  <th className="px-4 py-3 text-center">Terjual</th>
                  <th className="px-4 py-3 text-right">Pendapatan</th>
                  <th className="px-4 py-3 text-right">HPP</th>
                  <th className="px-4 py-3 text-right">Laba</th>
                  <th className="px-4 py-3 text-center">Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {sorted.map((r) => (
                  <tr key={r.item_id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900 dark:text-white">{r.item_name}</p>
                      {r.sku && <p className="text-xs text-slate-400 font-mono">{r.sku}</p>}
                    </td>
                    <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-300">{r.quantity_sold}</td>
                    <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-300">{formatRupiah(r.revenue)}</td>
                    <td className="px-4 py-3 text-right text-slate-400">{formatRupiah(r.hpp)}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`inline-flex items-center gap-1 font-semibold ${r.profit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600"}`}>
                        {r.profit >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                        {formatRupiah(r.profit)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge
                        variant="secondary"
                        className={`text-[11px] ${
                          r.margin_pct >= 30
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
                            : r.margin_pct >= 10
                              ? "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400"
                              : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                        }`}
                      >
                        {r.margin_pct}%
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
