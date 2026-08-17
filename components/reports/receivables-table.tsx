"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader, Phone, TrendingUp, MessageCircle } from "lucide-react";
import { formatRupiah } from "@/lib/data/items";
import { openWhatsApp, buildReceivableReminderMessage } from "@/lib/utils/whatsapp";
import { DashboardCard } from "@/components/dashboard/ui/dashboard-card";
import type { ReceivablesReport, ReceivableRow } from "@/lib/types/database";
import { useLocale } from "@/lib/locales";

function agingBadgeClass(days: number) {
  if (days <= 7) return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300";
  if (days <= 30) return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300";
  if (days <= 60) return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300";
  return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
}

function agingLabel(days: number) {
  if (days <= 7) return "reports.agingBadge7";
  if (days <= 30) return "reports.agingBadge8_30";
  if (days <= 60) return "reports.agingBadge31_60";
  return "reports.agingBadge60plus";
}

function statusBadge(status: string, t: (k: string) => string) {
  if (status === "unpaid") {
    return <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800">{t("reports.statusDebt")}</Badge>;
  }
  return <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800">{t("reports.statusPartialPay")}</Badge>;
}

export function ReceivablesTable() {
  const { t, locale } = useLocale();
  const [data, setData] = useState<ReceivablesReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/reports/receivables", { cache: "no-store" });
      if (!res.ok) throw new Error(t("reports.receivablesLoadFailed"));
      const json = (await res.json()) as ReceivablesReport;
      setError(null);
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("reports.reportLoadGeneric"));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const rows: ReceivableRow[] = data?.rows ?? [];
  const totalRows = rows.reduce((s, r) => s + r.remaining_amount, 0);

  return (
    <div className="space-y-5">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <DashboardCard className="p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t("reports.totalReceivable")}</p>
          <p className="mt-1 text-xl font-bold text-red-600 dark:text-red-400">
            {formatRupiah(data?.total_outstanding ?? 0)}
          </p>
        </DashboardCard>
        <DashboardCard className="p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t("reports.debtors")}</p>
          <p className="mt-1 text-xl font-bold text-slate-800 dark:text-white">
            {t("reports.peopleCount", { n: data?.total_customers ?? 0 })}
          </p>
        </DashboardCard>
        <DashboardCard className="p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t("reports.aging7")}</p>
          <p className="mt-1 text-lg font-bold text-emerald-600 dark:text-emerald-400">
            {formatRupiah(data?.aging_0_7 ?? 0)}
          </p>
        </DashboardCard>
        <DashboardCard className="p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t("reports.aging8_30")}</p>
          <p className="mt-1 text-lg font-bold text-amber-600 dark:text-amber-400">
            {formatRupiah(data?.aging_8_30 ?? 0)}
          </p>
        </DashboardCard>
        <DashboardCard className="p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t("reports.aging30plus")}</p>
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
                <th className="px-4 py-3 text-left font-medium">{t("transactions.invoice")}</th>
                <th className="px-4 py-3 text-left font-medium">{t("masterData.customer")}</th>
                <th className="px-4 py-3 text-right font-medium">{t("common.total")}</th>
                <th className="px-4 py-3 text-right font-medium">{t("reports.paid")}</th>
                <th className="px-4 py-3 text-right font-medium">{t("reports.remaining")}</th>
                <th className="px-4 py-3 text-center font-medium">{t("common.status")}</th>
                <th className="px-4 py-3 text-center font-medium">{t("reports.agingReceivable")}</th>
                <th className="px-4 py-3 text-center font-medium">{t("common.actions")}</th>
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
                    {t("reports.noReceivables")}
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.sale_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/transactions/sales/${r.sale_id}`}
                        className="font-medium text-sky-600 dark:text-sky-400 hover:underline"
                      >
                        {r.invoice_number}
                      </Link>
                      <p className="text-xs text-slate-400">
                        {new Date(r.sale_date).toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900 dark:text-white">{r.customer_name}</p>
                      {r.customer_phone && (
                        <p className="text-xs text-slate-400 inline-flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {r.customer_phone}
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
                    <td className="px-4 py-3 text-center">{statusBadge(r.payment_status, t)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${agingBadgeClass(r.aging_days)}`}>
                        {t(agingLabel(r.aging_days))}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5 h-8"
                          disabled={!r.customer_phone}
                          title={t("reports.waReminderTitle")}
                          onClick={() => {
                            if (r.customer_phone) openWhatsApp(r.customer_phone, buildReceivableReminderMessage(r));
                          }}
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                          {t("reports.waReminder")}
                        </Button>
                        <Link href={`/dashboard/transactions/sales/${r.sale_id}`}>
                          <Button variant="outline" size="sm" className="gap-1.5 h-8">
                            <TrendingUp className="h-3.5 w-3.5" />
                            {t("reports.payNow")}
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!isLoading && !error && rows.length > 0 && (
          <div className="flex justify-end border-t border-slate-200 dark:border-slate-800 px-4 py-3">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {t("reports.totalRemaining")}{" "}
              <span className="font-bold text-red-600 dark:text-red-400">{formatRupiah(totalRows)}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
