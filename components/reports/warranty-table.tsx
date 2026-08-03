"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Loader, ShieldCheck } from "lucide-react";
import { DashboardCard } from "@/components/dashboard/ui/dashboard-card";
import type { WarrantyEntry } from "@/lib/services/warranty.service";

function statusBadge(status: WarrantyEntry["status"]) {
  if (status === "active") {
    return <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800">Aktif</Badge>;
  }
  if (status === "expiring") {
    return <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800">Hampir Habis</Badge>;
  }
  return <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800">Kadaluarsa</Badge>;
}

export function WarrantyTable() {
  const [entries, setEntries] = useState<WarrantyEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "active" | "expiring" | "expired">("all");

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const query = filter === "all" ? "" : `?status=${filter}`;
      const res = await fetch(`/api/warranty${query}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Gagal memuat data garansi");
      const data = (await res.json()) as WarrantyEntry[];
      setEntries(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data");
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const active = entries.filter((e) => e.status === "active").length;
  const expiring = entries.filter((e) => e.status === "expiring").length;
  const expired = entries.filter((e) => e.status === "expired").length;

  return (
    <div className="space-y-5">
      {/* Stat + Filter */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="grid grid-cols-3 gap-3 w-full sm:w-auto">
          <DashboardCard className="p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Aktif</p>
            <p className="mt-0.5 text-lg font-bold text-emerald-600 dark:text-emerald-400">{active}</p>
          </DashboardCard>
          <DashboardCard className="p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Hampir Habis</p>
            <p className="mt-0.5 text-lg font-bold text-amber-600 dark:text-amber-400">{expiring}</p>
          </DashboardCard>
          <DashboardCard className="p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Kadaluarsa</p>
            <p className="mt-0.5 text-lg font-bold text-red-500">{expired}</p>
          </DashboardCard>
        </div>

        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as typeof filter)}
          className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-700 dark:text-slate-200"
        >
          <option value="all">Semua Status</option>
          <option value="active">Aktif</option>
          <option value="expiring">Hampir Habis</option>
          <option value="expired">Kadaluarsa</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Produk</th>
                <th className="px-4 py-3 text-left font-medium">Invoice</th>
                <th className="px-4 py-3 text-left font-medium">Customer</th>
                <th className="px-4 py-3 text-right font-medium">Garansi</th>
                <th className="px-4 py-3 text-right font-medium">Berakhir</th>
                <th className="px-4 py-3 text-center font-medium">Sisa</th>
                <th className="px-4 py-3 text-center font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <Loader className="h-6 w-6 animate-spin text-sky-500 mx-auto" />
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-red-500">{error}</td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    <ShieldCheck className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    Tidak ada data garansi.
                  </td>
                </tr>
              ) : (
                entries.map((e) => (
                  <tr key={e.sale_detail_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900 dark:text-white">{e.item_name}</p>
                      {e.sku && <p className="text-xs text-slate-400 font-mono">{e.sku}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/transactions/sales/${e.sale_id}`}
                        className="font-medium text-sky-600 dark:text-sky-400 hover:underline"
                      >
                        {e.invoice_number}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-slate-700 dark:text-slate-300">{e.customer_name}</p>
                      {e.customer_phone && <p className="text-xs text-slate-400">{e.customer_phone}</p>}
                    </td>
                    <td className="px-4 py-3 text-right">{e.warranty_months} bulan</td>
                    <td className="px-4 py-3 text-right font-medium">
                      {new Date(e.warranty_until).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={e.days_remaining < 0 ? "text-red-500" : e.days_remaining <= 30 ? "text-amber-600" : "text-emerald-600"}>
                        {e.days_remaining < 0 ? `${Math.abs(e.days_remaining)} hari lewat` : `${e.days_remaining} hari`}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">{statusBadge(e.status)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
