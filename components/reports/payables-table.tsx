"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader, Phone, Wallet } from "lucide-react";
import { formatRupiah } from "@/lib/data/items";
import { DashboardCard } from "@/components/dashboard/ui/dashboard-card";
import type { PayablesReport, PayableRow } from "@/lib/types/database";

function agingBadgeClass(days: number) {
  if (days <= 7) return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300";
  if (days <= 30) return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300";
  if (days <= 60) return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300";
  return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
}

function agingLabel(days: number) {
  if (days <= 7) return "≤ 7 hari";
  if (days <= 30) return "8–30 hari";
  if (days <= 60) return "31–60 hari";
  return "> 60 hari";
}

function statusBadge(status: string) {
  if (status === "unpaid") {
    return <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800">📝 Utang</Badge>;
  }
  return <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800">💰 Sebagian</Badge>;
}

export function PayablesTable() {
  const [data, setData] = useState<PayablesReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/reports/payables", { cache: "no-store" });
      if (!res.ok) throw new Error("Gagal memuat laporan hutang");
      const json = (await res.json()) as PayablesReport;
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat laporan");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const rows: PayableRow[] = data?.rows ?? [];

  return (
    <div className="space-y-5">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <DashboardCard className="p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Hutang</p>
          <p className="mt-1 text-xl font-bold text-red-600 dark:text-red-400">
            {formatRupiah(data?.total_outstanding ?? 0)}
          </p>
        </DashboardCard>
        <DashboardCard className="p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Kreditur</p>
          <p className="mt-1 text-xl font-bold text-slate-800 dark:text-white">
            {data?.total_suppliers ?? 0} supplier
          </p>
        </DashboardCard>
        <DashboardCard className="p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">≤ 7 hari</p>
          <p className="mt-1 text-lg font-bold text-emerald-600 dark:text-emerald-400">
            {formatRupiah(data?.aging_0_7 ?? 0)}
          </p>
        </DashboardCard>
        <DashboardCard className="p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">8–30 hari</p>
          <p className="mt-1 text-lg font-bold text-amber-600 dark:text-amber-400">
            {formatRupiah(data?.aging_8_30 ?? 0)}
          </p>
        </DashboardCard>
        <DashboardCard className="p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">&gt; 30 hari</p>
          <p className="mt-1 text-lg font-bold text-red-500">
            {formatRupiah((data?.aging_31_60 ?? 0) + (data?.aging_60_plus ?? 0))}
          </p>
        </DashboardCard>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Invoice</th>
                <th className="px-4 py-3 text-left font-medium">Supplier</th>
                <th className="px-4 py-3 text-right font-medium">Total</th>
                <th className="px-4 py-3 text-right font-medium">Dibayar</th>
                <th className="px-4 py-3 text-right font-medium">Sisa</th>
                <th className="px-4 py-3 text-center font-medium">Status</th>
                <th className="px-4 py-3 text-center font-medium">Umur Hutang</th>
                <th className="px-4 py-3 text-center font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="text-center py-12">
                    <Loader className="h-6 w-6 animate-spin text-sky-500 mx-auto" />
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-red-500">{error}</td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    🎉 Tidak ada hutang — semua pembelian lunas.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.purchase_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/transactions/purchases/${r.purchase_id}`}
                        className="font-medium text-sky-600 dark:text-sky-400 hover:underline"
                      >
                        {r.invoice_number}
                      </Link>
                      <p className="text-xs text-slate-400">
                        {new Date(r.purchase_date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900 dark:text-white">{r.supplier_name}</p>
                      {r.supplier_phone && (
                        <p className="text-xs text-slate-400 inline-flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {r.supplier_phone}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-slate-700 dark:text-slate-300">
                      {formatRupiah(r.total_amount)}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-500 dark:text-slate-400">
                      {formatRupiah(r.paid_amount)}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-red-600 dark:text-red-400">
                      {formatRupiah(r.remaining_amount)}
                    </td>
                    <td className="px-4 py-3 text-center">{statusBadge(r.payment_status)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${agingBadgeClass(r.aging_days)}`}>
                        {agingLabel(r.aging_days)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Link href={`/dashboard/transactions/purchases/${r.purchase_id}`}>
                        <Button variant="outline" size="sm" className="gap-1.5 h-8">
                          <Wallet className="h-3.5 w-3.5" />
                          Bayar
                        </Button>
                      </Link>
                    </td>
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
