"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, TrendingDown, TrendingUp, Wallet, Download } from "lucide-react";
import {
  DashboardCard,
  SectionHeader,
} from "@/components/dashboard/ui/dashboard-card";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { MechanicPerformanceTable } from "@/components/reports/mechanic-performance-table";
import { WeeklySalarySummary } from "@/components/reports/weekly-salary-summary";

/* ───── Types ───── */

type SalesReport = {
  total_sales: number;
  total_transactions: number;
  daily_breakdown: Array<{ date: string; amount: number; count: number }>;
};

type PurchasesReport = {
  total_purchases: number;
  total_transactions: number;
  daily_breakdown: Array<{ date: string; amount: number; count: number }>;
};

type ProfitLossReport = {
  total_sales: number;
  total_purchases: number;
  gross_profit: number;
  total_service_fees: number;
  net_profit: number;
  hpp_total: number;
  total_expenses: number;
  total_mechanic_salaries: number;
  total_mechanic_commissions: number;
  net_profit_owner: number;
};

/* ───── Helpers ───── */

function toInputDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

function getDefaultRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 30);
  return { startDate: toInputDate(start), endDate: toInputDate(end) };
}

/* ───── Stat Card ───── */

function ReportStat({
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
    <DashboardCard className="p-5">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
          {label}
        </p>
        <Icon className={cn("h-4 w-4", iconColor)} />
      </div>
      <p className="mt-2 text-2xl font-bold tracking-tight text-slate-800 dark:text-white">
        {value}
      </p>
      {sub && (
        <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
          {sub}
        </p>
      )}
    </DashboardCard>
  );
}

/* ───── Main Component ───── */

export default function ReportsPage() {
  const defaults = useMemo(() => getDefaultRange(), []);
  const [startDate, setStartDate] = useState(defaults.startDate);
  const [endDate, setEndDate] = useState(defaults.endDate);

  const [sales, setSales] = useState<SalesReport | null>(null);
  const [purchases, setPurchases] = useState<PurchasesReport | null>(null);
  const [profitLoss, setProfitLoss] = useState<ProfitLossReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState("keuangan");

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const query = `start_date=${startDate}&end_date=${endDate}`;
      const [salesRes, purchasesRes, profitLossRes] = await Promise.all([
        fetch(`/api/reports/sales?${query}`, { cache: "no-store" }),
        fetch(`/api/reports/purchases?${query}`, { cache: "no-store" }),
        fetch(`/api/reports/profit-loss?${query}`, { cache: "no-store" }),
      ]);

      if (!salesRes.ok || !purchasesRes.ok || !profitLossRes.ok) {
        if (
          salesRes.status === 500 ||
          purchasesRes.status === 500 ||
          profitLossRes.status === 500
        ) {
          setSales({ total_sales: 0, total_transactions: 0, daily_breakdown: [] });
          setPurchases({ total_purchases: 0, total_transactions: 0, daily_breakdown: [] });
          setProfitLoss({
            total_sales: 0,
            total_purchases: 0,
            gross_profit: 0,
            total_service_fees: 0,
            net_profit: 0,
            hpp_total: 0,
            total_expenses: 0,
            total_mechanic_salaries: 0,
            total_mechanic_commissions: 0,
            net_profit_owner: 0,
          });
          return;
        }

        throw new Error("Gagal mengambil data report.");
      }

      const [salesData, purchasesData, profitLossData] = await Promise.all([
        salesRes.json(),
        purchasesRes.json(),
        profitLossRes.json(),
      ]);

      setSales(salesData);
      setPurchases(purchasesData);
      setProfitLoss(profitLossData);
    } catch (err) {
      console.error(err);
      setError("Tidak dapat memuat report. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const dailyRows = useMemo(() => {
    const salesByDate = new Map(
      (sales?.daily_breakdown ?? []).map((x) => [x.date, x]),
    );
    const purchasesByDate = new Map(
      (purchases?.daily_breakdown ?? []).map((x) => [x.date, x]),
    );

    const dateSet = new Set<string>([
      ...Array.from(salesByDate.keys()),
      ...Array.from(purchasesByDate.keys()),
    ]);

    return Array.from(dateSet)
      .sort((a, b) => a.localeCompare(b))
      .map((date) => {
        const sale = salesByDate.get(date);
        const purchase = purchasesByDate.get(date);
        return {
          date,
          salesAmount: sale?.amount ?? 0,
          salesCount: sale?.count ?? 0,
          purchasesAmount: purchase?.amount ?? 0,
          purchasesCount: purchase?.count ?? 0,
        };
      });
  }, [sales, purchases]);

  return (
    <>
      <Navbar
        title="Reports"
        subtitle="Laporan keuangan, laba rugi, dan kinerja mekanik."
      />

      <Tabs value={tab} onValueChange={setTab} className="space-y-5">
        <TabsList className="bg-transparent border-b border-slate-200 dark:border-slate-700 rounded-none w-full justify-start h-auto p-0 gap-0">
          <TabsTrigger
            value="keuangan"
            className="data-[state=active]:border-b-2 data-[state=active]:border-sky-500 data-[state=active]:text-sky-600 data-[state=active]:shadow-none rounded-none px-5 py-2.5 text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white border-b-2 border-transparent"
          >
            📊 Keuangan
          </TabsTrigger>
          <TabsTrigger
            value="mekanik"
            className="data-[state=active]:border-b-2 data-[state=active]:border-sky-500 data-[state=active]:text-sky-600 data-[state=active]:shadow-none rounded-none px-5 py-2.5 text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white border-b-2 border-transparent"
          >
            👨‍🔧 Kinerja Mekanik
          </TabsTrigger>
          <TabsTrigger
            value="gaji"
            className="data-[state=active]:border-b-2 data-[state=active]:border-sky-500 data-[state=active]:text-sky-600 data-[state=active]:shadow-none rounded-none px-5 py-2.5 text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white border-b-2 border-transparent"
          >
            💰 Gaji Mingguan
          </TabsTrigger>
        </TabsList>

        <TabsContent value="keuangan" className="mt-0 space-y-5">
        {/* Date Filters */}
        <DashboardCard className="p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
            <div className="w-full space-y-1.5 lg:max-w-xs">
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Start Date
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="w-full space-y-1.5 lg:max-w-xs">
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
                End Date
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <Button
              className="h-9 bg-sky-500 text-white hover:bg-sky-600"
              onClick={loadReports}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Loading
                </>
              ) : (
                "Apply"
              )}
            </Button>
          </div>
          {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
          <div className="mt-3 flex flex-wrap gap-2 border-t pt-3">
            <Button variant="outline" size="sm" className="gap-2" onClick={() => window.open(`/api/export?type=profit-loss&start_date=${startDate}&end_date=${endDate}`, "_blank")}>
              <Download className="h-4 w-4" /> Export Laba/Rugi (.xlsx)
            </Button>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => window.open(`/api/export?type=sales&start_date=${startDate}&end_date=${endDate}`, "_blank")}>
              <Download className="h-4 w-4" /> Export Penjualan (.xlsx)
            </Button>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => window.open(`/api/export?type=purchases&start_date=${startDate}&end_date=${endDate}`, "_blank")}>
              <Download className="h-4 w-4" /> Export Pembelian (.xlsx)
            </Button>
          </div>
        </DashboardCard>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <ReportStat
            label="Total Sales"
            value={formatCurrency(sales?.total_sales ?? 0)}
            sub={`${sales?.total_transactions ?? 0} transaksi`}
            icon={TrendingUp}
            iconColor="text-emerald-500"
          />
          <ReportStat
            label="HPP (COGS)"
            value={formatCurrency(profitLoss?.hpp_total ?? 0)}
            sub="Harga Pokok Penjualan"
            icon={TrendingDown}
            iconColor="text-rose-500"
          />
          <ReportStat
            label="Gross Profit"
            value={formatCurrency(profitLoss?.gross_profit ?? 0)}
            sub={`Service fee: ${formatCurrency(profitLoss?.total_service_fees ?? 0)}`}
            icon={Wallet}
            iconColor="text-sky-500"
          />
          <ReportStat
            label="Operational Profit"
            value={formatCurrency(profitLoss?.net_profit ?? 0)}
            sub="Gross profit + service fees"
            icon={Wallet}
            iconColor="text-indigo-500"
          />
        </div>

        {/* Owner Net Profit Breakdown */}
        <DashboardCard>
          <SectionHeader label="Laba bersih pemilik" title="Rincian Laba Bersih" />
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                <tr>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-400">Total Penjualan</td>
                  <td className="px-5 py-3 text-right font-mono font-medium text-slate-700 dark:text-slate-300">{formatCurrency(profitLoss?.total_sales ?? 0)}</td>
                </tr>
                <tr>
                  <td className="px-5 py-3 pl-8 text-slate-500 dark:text-slate-400">HPP (Modal Barang)</td>
                  <td className="px-5 py-3 text-right font-mono text-rose-600 dark:text-rose-400">- {formatCurrency(profitLoss?.hpp_total ?? 0)}</td>
                </tr>
                <tr className="border-b-2 border-slate-200 dark:border-slate-700">
                  <td className="px-5 py-3 font-semibold text-slate-700 dark:text-slate-300">Laba Kotor</td>
                  <td className="px-5 py-3 text-right font-mono font-bold text-slate-800 dark:text-white">{formatCurrency(profitLoss?.gross_profit ?? 0)}</td>
                </tr>
                <tr>
                  <td className="px-5 py-3 pl-8 text-slate-500 dark:text-slate-400">Pendapatan Jasa Service</td>
                  <td className="px-5 py-3 text-right font-mono text-sky-600 dark:text-sky-400">+ {formatCurrency(profitLoss?.total_service_fees ?? 0)}</td>
                </tr>
                <tr className="border-b-2 border-slate-200 dark:border-slate-700">
                  <td className="px-5 py-3 font-semibold text-slate-700 dark:text-slate-300">Laba Operasional</td>
                  <td className="px-5 py-3 text-right font-mono font-bold text-indigo-600 dark:text-indigo-400">{formatCurrency(profitLoss?.net_profit ?? 0)}</td>
                </tr>
                <tr>
                  <td className="px-5 py-3 pl-8 text-slate-500 dark:text-slate-400">Biaya Operasional</td>
                  <td className="px-5 py-3 text-right font-mono text-rose-600 dark:text-rose-400">- {formatCurrency(profitLoss?.total_expenses ?? 0)}</td>
                </tr>
                <tr>
                  <td className="px-5 py-3 pl-8 text-slate-500 dark:text-slate-400">Gaji Mekanik</td>
                  <td className="px-5 py-3 text-right font-mono text-rose-600 dark:text-rose-400">- {formatCurrency(profitLoss?.total_mechanic_salaries ?? 0)}</td>
                </tr>
                <tr>
                  <td className="px-5 py-3 pl-8 text-slate-500 dark:text-slate-400">Komisi Mekanik</td>
                  <td className="px-5 py-3 text-right font-mono text-rose-600 dark:text-rose-400">- {formatCurrency(profitLoss?.total_mechanic_commissions ?? 0)}</td>
                </tr>
                <tr className="border-t-2 border-slate-200 bg-amber-50/50 dark:border-slate-700 dark:bg-amber-900/10">
                  <td className="px-5 py-3 text-base font-extrabold text-amber-800 dark:text-amber-200">
                    💰 LABA BERSIH PEMILIK
                  </td>
                  <td className="px-5 py-3 text-right">
                    <span className={`font-mono text-lg font-extrabold ${(profitLoss?.net_profit_owner ?? 0) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                      {formatCurrency(profitLoss?.net_profit_owner ?? 0)}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="border-t px-5 py-2.5 text-[10px] text-slate-400 dark:text-slate-500">
            Laba Bersih Pemilik = Laba Operasional − Biaya − Gaji − Komisi
          </div>
        </DashboardCard>

        {/* Daily Breakdown Table */}
        <DashboardCard>
          <SectionHeader label="Analytics table" title="Daily Breakdown" />
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50/60 text-left text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:bg-slate-900/30 dark:text-slate-500">
                <tr>
                  <th className="px-5 py-2.5">Date</th>
                  <th className="px-5 py-2.5 text-right">Sales Amount</th>
                  <th className="px-5 py-2.5 text-right">Sales Tx</th>
                  <th className="px-5 py-2.5 text-right">Purchase Amount</th>
                  <th className="px-5 py-2.5 text-right">Purchase Tx</th>
                  <th className="px-5 py-2.5 text-right">Daily Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {dailyRows.length === 0 ? (
                  <tr>
                    <td
                      className="px-5 py-8 text-center text-slate-400"
                      colSpan={6}
                    >
                      No data in selected date range.
                    </td>
                  </tr>
                ) : (
                  dailyRows.map((row) => {
                    const margin = row.salesAmount - row.purchasesAmount;
                    return (
                      <tr
                        key={row.date}
                        className="transition-colors hover:bg-slate-50/60 dark:hover:bg-slate-800/30"
                      >
                        <td className="px-5 py-2.5 text-slate-600 dark:text-slate-300">
                          {row.date}
                        </td>
                        <td className="px-5 py-2.5 text-right font-medium text-slate-700 dark:text-slate-200">
                          {formatCurrency(row.salesAmount)}
                        </td>
                        <td className="px-5 py-2.5 text-right text-slate-500 dark:text-slate-400">
                          {row.salesCount}
                        </td>
                        <td className="px-5 py-2.5 text-right font-medium text-slate-700 dark:text-slate-200">
                          {formatCurrency(row.purchasesAmount)}
                        </td>
                        <td className="px-5 py-2.5 text-right text-slate-500 dark:text-slate-400">
                          {row.purchasesCount}
                        </td>
                        <td
                          className={cn(
                            "px-5 py-2.5 text-right font-bold",
                            margin >= 0
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-red-600 dark:text-red-400",
                          )}
                        >
                          {formatCurrency(margin)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </DashboardCard>
        </TabsContent>

        <TabsContent value="mekanik" className="mt-0">
          <MechanicPerformanceTable
            startDate={startDate}
            endDate={endDate}
          />
        </TabsContent>

        <TabsContent value="gaji" className="mt-0">
          <WeeklySalarySummary
            startDate={startDate}
            endDate={endDate}
          />
        </TabsContent>
      </Tabs>
    </>
  );
}
