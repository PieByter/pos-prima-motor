"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, TrendingDown, TrendingUp, Wallet } from "lucide-react";

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
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value ?? 0);
}

function toInputDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

function getDefaultRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 30);
  return {
    startDate: toInputDate(start),
    endDate: toInputDate(end),
  };
}

export default function ReportsPage() {
  const defaults = useMemo(() => getDefaultRange(), []);
  const [startDate, setStartDate] = useState(defaults.startDate);
  const [endDate, setEndDate] = useState(defaults.endDate);

  const [sales, setSales] = useState<SalesReport | null>(null);
  const [purchases, setPurchases] = useState<PurchasesReport | null>(null);
  const [profitLoss, setProfitLoss] = useState<ProfitLossReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        subtitle="Laporan penjualan, pembelian, dan laba rugi."
      />

      <div className="space-y-6">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-end gap-4">
            <div className="w-52 space-y-1.5">
              <label className="text-sm font-medium text-slate-600 dark:text-slate-300">
                Start Date
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="w-52 space-y-1.5">
              <label className="text-sm font-medium text-slate-600 dark:text-slate-300">
                End Date
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <Button
              className="bg-sky-500 text-white hover:bg-sky-600"
              onClick={loadReports}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading
                </>
              ) : (
                "Apply"
              )}
            </Button>
          </div>
          {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Total Sales
              </p>
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
              {formatCurrency(sales?.total_sales ?? 0)}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {sales?.total_transactions ?? 0} transaksi
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Total Purchases
              </p>
              <TrendingDown className="h-4 w-4 text-orange-500" />
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
              {formatCurrency(purchases?.total_purchases ?? 0)}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {purchases?.total_transactions ?? 0} transaksi
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Gross Profit
              </p>
              <Wallet className="h-4 w-4 text-sky-500" />
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
              {formatCurrency(profitLoss?.gross_profit ?? 0)}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Service fee: {formatCurrency(profitLoss?.total_service_fees ?? 0)}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Net Profit
              </p>
              <Wallet className="h-4 w-4 text-indigo-500" />
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
              {formatCurrency(profitLoss?.net_profit ?? 0)}
            </p>
            <p className="mt-1 text-sm text-slate-500">Setelah biaya pembelian</p>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="border-b border-slate-200 px-6 py-4 dark:border-slate-700">
            <h3 className="font-semibold text-slate-900 dark:text-white">
              Daily Breakdown
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900/40 dark:text-slate-400">
                <tr>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3 text-right">Sales Amount</th>
                  <th className="px-6 py-3 text-right">Sales Tx</th>
                  <th className="px-6 py-3 text-right">Purchase Amount</th>
                  <th className="px-6 py-3 text-right">Purchase Tx</th>
                  <th className="px-6 py-3 text-right">Daily Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {dailyRows.length === 0 ? (
                  <tr>
                    <td className="px-6 py-10 text-center text-slate-500" colSpan={6}>
                      No data in selected date range.
                    </td>
                  </tr>
                ) : (
                  dailyRows.map((row) => {
                    const margin = row.salesAmount - row.purchasesAmount;
                    return (
                      <tr key={row.date} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                        <td className="px-6 py-3 text-slate-700 dark:text-slate-200">{row.date}</td>
                        <td className="px-6 py-3 text-right font-medium text-slate-700 dark:text-slate-200">
                          {formatCurrency(row.salesAmount)}
                        </td>
                        <td className="px-6 py-3 text-right text-slate-600 dark:text-slate-300">{row.salesCount}</td>
                        <td className="px-6 py-3 text-right font-medium text-slate-700 dark:text-slate-200">
                          {formatCurrency(row.purchasesAmount)}
                        </td>
                        <td className="px-6 py-3 text-right text-slate-600 dark:text-slate-300">{row.purchasesCount}</td>
                        <td
                          className={`px-6 py-3 text-right font-semibold ${
                            margin >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                          }`}
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
        </div>
      </div>
    </>
  );
}
