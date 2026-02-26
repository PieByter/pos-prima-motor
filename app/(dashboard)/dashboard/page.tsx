import { Navbar } from "@/components/layout/navbar";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { SalesChart } from "@/components/dashboard/sales-chart";
import { TopSellingItems } from "@/components/dashboard/top-selling-items";
import { LowStockAlert } from "@/components/dashboard/low-stock-alert";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";

export default function DashboardPage() {
  return (
    <>
      <Navbar
        title="Dashboard Overview"
        subtitle="Welcome back, here's what's happening at Prima Motor today."
      />

      {/* Summary Cards */}
      <div className="mb-8">
        <SummaryCards />
      </div>

      {/* Chart + Top Items */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <SalesChart />
        </div>
        <TopSellingItems />
      </div>

      {/* Low Stock + Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <LowStockAlert />
        <RecentTransactions />
      </div>

      {/* Footer */}
      <footer className="text-center text-xs text-gray-400 dark:text-gray-500 pb-4">
        © 2026 Prima Motor POS System. All rights reserved.
      </footer>
    </>
  );
}
