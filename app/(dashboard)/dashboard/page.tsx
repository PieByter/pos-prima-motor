"use client";

import { useState } from "react";
import { Navbar } from "@/components/layout/navbar";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { SalesChart } from "@/components/dashboard/sales-chart";
import { TopSellingItems } from "@/components/dashboard/top-selling-items";
import { LowStockAlert } from "@/components/dashboard/low-stock-alert";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { TodaySummary } from "@/components/dashboard/today-summary";
import { RestockRecommendations } from "@/components/dashboard/restock-recommendations";
import { DashboardPrintButton } from "@/components/dashboard/dashboard-print-button";
import { useUserRole } from "@/lib/hooks/use-user-role";
import { EyeOff } from "lucide-react";

function toInputDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default function DashboardPage() {
  const currentYear = new Date().getFullYear();
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 30);

  const [startDate, setStartDate] = useState(toInputDate(thirtyDaysAgo));
  const [endDate, setEndDate] = useState(toInputDate(today));
  const { isAdmin } = useUserRole();

  return (
    <div className="space-y-6">
      <Navbar
        title={isAdmin ? "Dashboard Overview" : "Dashboard Mekanik"}
        subtitle={isAdmin
          ? "Welcome back, here's what's happening at Prima Motor today."
          : "Pantau transaksi dan stok yang Anda tangani."
        }
      />

      {/* Date Range Filter */}
      <section className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border bg-white dark:bg-slate-800 px-5 py-3 shadow-sm">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Filter Periode</span>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
          />
          <span className="text-slate-400">—</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
          />
        </div>
        {(startDate !== toInputDate(thirtyDaysAgo) || endDate !== toInputDate(today)) && (
          <button
            onClick={() => {
              const t = new Date();
              const t30 = new Date(t);
              t30.setDate(t.getDate() - 30);
              setStartDate(toInputDate(t30));
              setEndDate(toInputDate(t));
            }}
            className="text-xs text-sky-500 hover:underline"
          >
            Reset
          </button>
        )}
        <div className="ml-auto no-print">
          <DashboardPrintButton />
        </div>
      </section>

      {/* Hero Banner */}
      <section className="relative overflow-hidden rounded-2xl border border-slate-800/30 bg-linear-to-br from-slate-900 via-sky-950 to-cyan-900 px-6 py-7 text-white shadow-lg sm:px-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(125,211,252,0.2),transparent_40%)]" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-sky-200 backdrop-blur">
              Operasional hari ini
            </span>
            <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
              Kontrol penjualan, stok, dan laporan dari satu dashboard.
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-sky-100/70">
              Pantau pergerakan inventory, item kritis, dan transaksi terbaru.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:min-w-88">
            <div className="rounded-xl border border-white/10 bg-white/5 p-3.5 backdrop-blur">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-sky-200/70">Status sistem</p>
              <p className="mt-1.5 text-sm font-semibold">Online & tersinkron</p>
            </div>
            <TodaySummary />
          </div>
        </div>
      </section>

      {/* Summary Cards */}
      <SummaryCards dateRange={{ start: startDate, end: endDate }} />

      {/* Chart + Top Items */}
      {isAdmin && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <SalesChart dateRange={{ start: startDate, end: endDate }} />
          </div>
          <TopSellingItems />
        </div>
      )}

      {!isAdmin && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white py-12 dark:border-slate-700 dark:bg-slate-800">
          <EyeOff className="mb-3 h-10 w-10 text-slate-300" />
          <p className="text-sm font-medium text-slate-500">Grafik penjualan hanya untuk Admin</p>
        </div>
      )}

      {/* Low Stock + Recent Transactions */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <LowStockAlert />
        <RecentTransactions />
      </div>

      {/* Auto Restock Recommendation */}
      {isAdmin && <RestockRecommendations />}

      {/* Footer */}
      <footer className="pb-2 text-center text-xs text-slate-400 dark:text-slate-500">
        © {currentYear} Prima Motor POS System. All rights reserved.
      </footer>
    </div>
  );
}
