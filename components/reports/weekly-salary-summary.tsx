"use client";

import { useCallback, useEffect, useState } from "react";
import {
  DashboardCard,
  SectionHeader,
} from "@/components/dashboard/ui/dashboard-card";
import { Button } from "@/components/ui/button";
import { Loader2, Wallet, Wrench, TrendingUp, Users, Printer } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

/* ───── Types ───── */

type WeeklySalaryRow = {
  mechanic_id: string;
  mechanic_name: string;
  weekly_salary: number;
  total_service_fees: number;
  service_commission_pct: number;
  commission: number;
  total_earnings: number;
};

type Props = {
  startDate: string;
  endDate: string;
};

/* ───── Helpers ───── */

function formatDateRange(start: string, end: string) {
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" };
  const s = new Date(start);
  const e = new Date(end);
  return `${s.toLocaleDateString("id-ID", opts)} — ${e.toLocaleDateString("id-ID", opts)}`;
}

/* ───── Stat Mini ───── */

function MiniStat({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800/50">
      <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", color)}>
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
          {label}
        </p>
        <p className="text-sm font-bold text-slate-800 dark:text-white">{value}</p>
      </div>
    </div>
  );
}

/* ───── Component ───── */

export function WeeklySalarySummary({ startDate, endDate }: Props) {
  const [data, setData] = useState<WeeklySalaryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadWeeklySalary = useCallback(async () => {
    try {
      const query = `start_date=${startDate}&end_date=${endDate}`;
      const res = await fetch(`/api/reports/weekly-salary?${query}`, {
        cache: "no-store",
      });

      if (!res.ok) {
        if (res.status === 500) {
          setData([]);
          return;
        }
        throw new Error("Gagal mengambil ringkasan gaji.");
      }

      const json = await res.json();
      setError(null);
      setData((json ?? []) as WeeklySalaryRow[]);
    } catch (err) {
      console.error(err);
      setError("Tidak dapat memuat ringkasan gaji.");
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      void loadWeeklySalary();
    }, 0);
    return () => window.clearTimeout(t);
  }, [loadWeeklySalary]);

  const totals = {
    salary: data.reduce((s, r) => s + r.weekly_salary, 0),
    serviceFees: data.reduce((s, r) => s + r.total_service_fees, 0),
    commission: data.reduce((s, r) => s + r.commission, 0),
    earnings: data.reduce((s, r) => s + r.total_earnings, 0),
  };

  return (
    <div className="space-y-5">
      {/* Summary Bar */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MiniStat
          label="Total Mekanik"
          value={`${data.length} orang`}
          icon={Users}
          color="bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400"
        />
        <MiniStat
          label="Total Gaji Pokok"
          value={formatCurrency(totals.salary)}
          icon={Wallet}
          color="bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400"
        />
        <MiniStat
          label="Total Komisi Jasa"
          value={formatCurrency(totals.commission)}
          icon={TrendingUp}
          color="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
        />
        <MiniStat
          label="Total Dibayarkan"
          value={formatCurrency(totals.earnings)}
          icon={Wrench}
          color="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
        />
      </div>

      {/* Print-friendly Salary Card */}
      <DashboardCard className="print:shadow-none print:border-0">
        <div className="flex items-center justify-between border-b px-5 py-3 no-print">
          <SectionHeader
            label="Slip gaji mingguan"
            title={`Ringkasan Gaji — ${formatDateRange(startDate, endDate)}`}
          />
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => window.print()}
          >
            <Printer className="h-4 w-4" />
            Print
          </Button>
        </div>

        {error && (
          <p className="px-5 pt-4 text-sm text-red-500">{error}</p>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50/60 text-left text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:bg-slate-900/30 dark:text-slate-500 print:bg-gray-100">
              <tr>
                <th className="px-5 py-3 font-semibold text-slate-500">Mekanik</th>
                <th className="px-5 py-3 text-right font-semibold text-slate-500">Gaji Pokok</th>
                <th className="px-5 py-3 text-right font-semibold text-slate-500">Total Jasa</th>
                <th className="px-5 py-3 text-right font-semibold text-slate-500">Komisi %</th>
                <th className="px-5 py-3 text-right font-semibold text-slate-500">Komisi</th>
                <th className="px-5 py-3 text-right font-semibold text-slate-600 dark:text-slate-300">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center">
                    <span className="inline-flex items-center gap-2 text-slate-400">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Memuat ringkasan gaji...
                    </span>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                    Tidak ada data mekanik aktif.
                  </td>
                </tr>
              ) : (
                <>
                  {data.map((row) => (
                    <tr
                      key={row.mechanic_id}
                      className="transition-colors hover:bg-slate-50/60 dark:hover:bg-slate-800/30 print:hover:bg-transparent"
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 print:bg-gray-200 print:text-gray-700">
                            {row.mechanic_name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-slate-800 dark:text-slate-200">
                            {row.mechanic_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right font-mono text-slate-700 dark:text-slate-300">
                        {formatCurrency(row.weekly_salary)}
                      </td>
                      <td className="px-5 py-3 text-right font-mono text-sky-600 dark:text-sky-400">
                        {formatCurrency(row.total_service_fees)}
                      </td>
                      <td className="px-5 py-3 text-right text-slate-600 dark:text-slate-400">
                        {row.service_commission_pct}%
                      </td>
                      <td className="px-5 py-3 text-right font-mono text-amber-600 dark:text-amber-400">
                        {formatCurrency(row.commission)}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span className="font-mono text-base font-bold text-slate-900 dark:text-white">
                          {formatCurrency(row.total_earnings)}
                        </span>
                      </td>
                    </tr>
                  ))}

                  {/* Totals Row */}
                  <tr className="border-t-2 border-slate-200 bg-amber-50/50 dark:border-slate-700 dark:bg-amber-900/10 print:bg-amber-50">
                    <td className="px-5 py-3 font-bold text-slate-700 dark:text-slate-300">
                      TOTAL
                    </td>
                    <td className="px-5 py-3 text-right font-mono font-bold text-slate-800 dark:text-white">
                      {formatCurrency(totals.salary)}
                    </td>
                    <td className="px-5 py-3 text-right font-mono font-bold text-sky-700 dark:text-sky-300">
                      {formatCurrency(totals.serviceFees)}
                    </td>
                    <td className="px-5 py-3"></td>
                    <td className="px-5 py-3 text-right font-mono font-bold text-amber-700 dark:text-amber-300">
                      {formatCurrency(totals.commission)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className="font-mono text-lg font-extrabold text-slate-900 dark:text-white">
                        {formatCurrency(totals.earnings)}
                      </span>
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 border-t px-5 py-3 text-xs text-slate-400 dark:text-slate-500 print:hidden">
          <span>💰 <strong>Total</strong> = Gaji Pokok + Komisi</span>
          <span>|</span>
          <span>🛠️ <strong>Komisi</strong> = % × Total Jasa</span>
          <span>|</span>
          <span>📅 Periode: {formatDateRange(startDate, endDate)}</span>
        </div>
      </DashboardCard>
    </div>
  );
}
