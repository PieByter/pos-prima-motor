"use client";

import { useCallback, useEffect, useState } from "react";
import {
  DashboardCard,
  SectionHeader,
} from "@/components/dashboard/ui/dashboard-card";
import { Loader2, Users, TrendingUp, Wallet, Wrench } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

/* ───── Types ───── */

type MechanicPerformanceRow = {
  mechanic_id: string;
  mechanic_name: string;
  total_sales: number;
  total_transactions: number;
  total_service_fees: number;
  hpp_total: number;
  gross_profit: number;
  weekly_salary: number;
  service_commission_pct: number;
  commission: number;
  total_earnings: number;
};

type Props = {
  startDate: string;
  endDate: string;
};

/* ───── Stat Card ───── */

function MechStat({
  label,
  value,
  sub,
  icon: Icon,
  iconColor,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  iconColor: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800/50">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">
          {label}
        </p>
        <Icon className={cn("h-4 w-4", iconColor)} />
      </div>
      <p className="mt-1.5 text-xl font-bold tracking-tight text-slate-800 dark:text-white">
        {value}
      </p>
      {sub && (
        <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
          {sub}
        </p>
      )}
    </div>
  );
}

/* ───── Component ───── */

export function MechanicPerformanceTable({ startDate, endDate }: Props) {
  const [data, setData] = useState<MechanicPerformanceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMechanicReport = useCallback(async () => {
    try {
      const query = `start_date=${startDate}&end_date=${endDate}`;
      const res = await fetch(`/api/reports/mechanic-performance?${query}`, {
        cache: "no-store",
      });

      if (!res.ok) {
        if (res.status === 500) {
          setData([]);
          return;
        }
        throw new Error("Gagal mengambil data kinerja mekanik.");
      }

      const json = await res.json();
      setError(null);
      setData((json ?? []) as MechanicPerformanceRow[]);
    } catch (err) {
      console.error(err);
      setError("Tidak dapat memuat report kinerja mekanik.");
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      void loadMechanicReport();
    }, 0);
    return () => window.clearTimeout(t);
  }, [loadMechanicReport]);

  const totals = {
    totalSales: data.reduce((s, r) => s + r.total_sales, 0),
    totalServiceFees: data.reduce((s, r) => s + r.total_service_fees, 0),
    totalCommission: data.reduce((s, r) => s + r.commission, 0),
    totalEarnings: data.reduce((s, r) => s + r.total_earnings, 0),
  };

  return (
    <div className="space-y-5">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MechStat
          label="Total Mekanik"
          value={`${data.length}`}
          sub="Mekanik aktif"
          icon={Users}
          iconColor="text-violet-500"
        />
        <MechStat
          label="Total Omset Mekanik"
          value={formatCurrency(totals.totalSales)}
          sub={`${data.reduce((s, r) => s + r.total_transactions, 0)} transaksi`}
          icon={TrendingUp}
          iconColor="text-emerald-500"
        />
        <MechStat
          label="Total Jasa Service"
          value={formatCurrency(totals.totalServiceFees)}
          sub="Akumulasi biaya jasa"
          icon={Wrench}
          iconColor="text-sky-500"
        />
        <MechStat
          label="Total Gaji + Komisi"
          value={formatCurrency(totals.totalEarnings)}
          sub={`Komisi: ${formatCurrency(totals.totalCommission)}`}
          icon={Wallet}
          iconColor="text-amber-500"
        />
      </div>

      {/* Table */}
      <DashboardCard>
        <SectionHeader
          label="Performa per mekanik"
          title={`Kinerja Mekanik — ${startDate} s/d ${endDate}`}
        />
        {error && (
          <p className="mb-4 text-sm text-red-500">{error}</p>
        )}
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50/60 text-left text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:bg-slate-900/30 dark:text-slate-500">
              <tr>
                <th className="px-4 py-2.5">Mekanik</th>
                <th className="px-4 py-2.5 text-right">Transaksi</th>
                <th className="px-4 py-2.5 text-right">Omset</th>
                <th className="px-4 py-2.5 text-right">Jasa</th>
                <th className="px-4 py-2.5 text-right">Komisi %</th>
                <th className="px-4 py-2.5 text-right">Komisi</th>
                <th className="px-4 py-2.5 text-right">Gaji</th>
                <th className="px-4 py-2.5 text-right font-semibold text-slate-600 dark:text-slate-300">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <span className="inline-flex items-center gap-2 text-slate-400">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Memuat data kinerja...
                    </span>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                    Belum ada data transaksi mekanik di periode ini.
                  </td>
                </tr>
              ) : (
                <>
                  {data.map((row) => (
                    <tr
                      key={row.mechanic_id}
                      className="transition-colors hover:bg-slate-50/60 dark:hover:bg-slate-800/30"
                    >
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-100 text-xs font-bold text-sky-700 dark:bg-sky-900/30 dark:text-sky-300">
                            {row.mechanic_name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-slate-800 dark:text-slate-200">
                            {row.mechanic_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-right text-slate-600 dark:text-slate-400">
                        {row.total_transactions}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-slate-700 dark:text-slate-300">
                        {formatCurrency(row.total_sales)}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-sky-600 dark:text-sky-400">
                        {formatCurrency(row.total_service_fees)}
                      </td>
                      <td className="px-4 py-2.5 text-right text-slate-600 dark:text-slate-400">
                        {row.service_commission_pct}%
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-amber-600 dark:text-amber-400">
                        {formatCurrency(row.commission)}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-slate-600 dark:text-slate-400">
                        {formatCurrency(row.weekly_salary)}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <span className="font-mono font-bold text-slate-800 dark:text-white">
                          {formatCurrency(row.total_earnings)}
                        </span>
                      </td>
                    </tr>
                  ))}

                  {/* Totals Row */}
                  <tr className="border-t-2 border-slate-200 bg-slate-50/50 font-semibold dark:border-slate-700 dark:bg-slate-900/40">
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                      TOTAL
                    </td>
                    <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-300">
                      {data.reduce((s, r) => s + r.total_transactions, 0)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-800 dark:text-white">
                      {formatCurrency(totals.totalSales)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-sky-700 dark:text-sky-300">
                      {formatCurrency(totals.totalServiceFees)}
                    </td>
                    <td className="px-4 py-3"></td>
                    <td className="px-4 py-3 text-right font-mono text-amber-700 dark:text-amber-300">
                      {formatCurrency(totals.totalCommission)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-700 dark:text-slate-300">
                      {formatCurrency(data.reduce((s, r) => s + r.weekly_salary, 0))}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-base text-slate-900 dark:text-white">
                      {formatCurrency(totals.totalEarnings)}
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </DashboardCard>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400">
        <span>
          💰 <strong>Total</strong> = Gaji Mingguan + (Komisi % × Total Jasa)
        </span>
        <span className="hidden sm:inline">|</span>
        <span>
          🛠️ <strong>Komisi</strong> = service_commission_pct × total_service_fees
        </span>
      </div>
    </div>
  );
}
