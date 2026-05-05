import { Navbar } from "@/components/layout/navbar";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { SalesChart } from "@/components/dashboard/sales-chart";
import { TopSellingItems } from "@/components/dashboard/top-selling-items";
import { LowStockAlert } from "@/components/dashboard/low-stock-alert";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";

export default function DashboardPage() {
  const currentYear = new Date().getFullYear();
  const todayLabel = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <div className="space-y-6">
      <Navbar
        title="Dashboard Overview"
        subtitle="Welcome back, here's what's happening at Prima Motor today."
      />

      {/* Hero Banner — streamlined */}
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
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-sky-200/70">
                Status sistem
              </p>
              <p className="mt-1.5 text-sm font-semibold">
                Online & tersinkron
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3.5 backdrop-blur">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-sky-200/70">
                Hari ini
              </p>
              <p className="mt-1.5 text-sm font-semibold">{todayLabel}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Summary Cards */}
      <SummaryCards />

      {/* Chart + Top Items */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SalesChart />
        </div>
        <TopSellingItems />
      </div>

      {/* Low Stock + Recent Transactions */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <LowStockAlert />
        <RecentTransactions />
      </div>

      {/* Footer */}
      <footer className="pb-2 text-center text-xs text-slate-400 dark:text-slate-500">
        © {currentYear} Prima Motor POS System. All rights reserved.
      </footer>
    </div>
  );
}
