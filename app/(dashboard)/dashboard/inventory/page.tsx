"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, TriangleAlert } from "lucide-react";
import {
  DashboardCard,
  SectionHeader,
} from "@/components/dashboard/ui/dashboard-card";
import { cn } from "@/lib/utils";

/* ───── Types ───── */

type StockSummaryRow = {
  item_id: number;
  name: string;
  sku: string | null;
  category: string | null;
  total_in: number;
  total_out: number;
  current_stock: number;
};

type PaginatedStock = {
  data: StockSummaryRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

type LowStockRow = {
  item_id: number;
  name: string;
  sku: string | null;
  current_stock: number;
};

type StockMovementRow = {
  id: number;
  item_id: number;
  type: "IN" | "OUT";
  quantity: number;
  reference_type: "purchase" | "sale" | null;
  reference_id: number | null;
  created_at: string;
  item?: { name: string; sku: string };
};

type PaginatedMovements = {
  data: StockMovementRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

/* ───── Stat Card Helper ───── */

function MiniStat({
  label,
  value,
  className,
}: {
  label: string;
  value: string | number;
  className?: string;
}) {
  return (
    <DashboardCard className="p-5">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
        {label}
      </p>
      <p
        className={cn(
          "mt-2 text-2xl font-bold tracking-tight text-slate-800 dark:text-white",
          className,
        )}
      >
        {value}
      </p>
    </DashboardCard>
  );
}

/* ───── Main Component ───── */

export default function InventoryPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "low" | "critical">("all");
  const [page, setPage] = useState(1);

  const [stock, setStock] = useState<PaginatedStock | null>(null);
  const [lowStock, setLowStock] = useState<LowStockRow[]>([]);
  const [movements, setMovements] = useState<PaginatedMovements | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadInventory = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const stockQuery = new URLSearchParams({
        page: String(page),
        limit: "12",
      });
      if (search.trim()) stockQuery.set("search", search.trim());
      if (status !== "all") stockQuery.set("stock_status", status);

      const [stockRes, lowStockRes, movementRes] = await Promise.all([
        fetch(`/api/stock?${stockQuery.toString()}`, { cache: "no-store" }),
        fetch("/api/stock/low-stock?threshold=5", { cache: "no-store" }),
        fetch("/api/stock/movements?page=1&limit=8", { cache: "no-store" }),
      ]);

      if (!stockRes.ok || !lowStockRes.ok || !movementRes.ok) {
        throw new Error("Gagal mengambil data inventory.");
      }

      const [stockData, lowStockData, movementData] = await Promise.all([
        stockRes.json(),
        lowStockRes.json(),
        movementRes.json(),
      ]);

      setStock(stockData);
      setLowStock(lowStockData ?? []);
      setMovements(movementData);
    } catch (err) {
      console.error(err);
      setError("Tidak dapat memuat inventory. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  const totalCurrentStock = useMemo(() => {
    return (stock?.data ?? []).reduce((sum, row) => sum + row.current_stock, 0);
  }, [stock]);

  return (
    <>
      <Navbar
        title="Inventory"
        subtitle="Monitoring stok, item low-stock, dan pergerakan barang."
      />

      <div className="space-y-5">
        {/* Stat Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MiniStat label="Items (Filtered)" value={stock?.total ?? 0} />
          <MiniStat label="Current Stock (Page)" value={totalCurrentStock} />
          <MiniStat
            label="Low Stock Items"
            value={lowStock.length}
            className="text-amber-600 dark:text-amber-400"
          />
          <MiniStat label="Recent Movements" value={movements?.total ?? 0} />
        </div>

        {/* Filters */}
        <DashboardCard className="p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
            <div className="w-full space-y-1.5 lg:max-w-md">
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Search Item
              </label>
              <Input
                placeholder="Cari nama item atau SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Stock Status
              </label>
              <select
                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:w-44"
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value as "all" | "low" | "critical");
                  setPage(1);
                }}
              >
                <option value="all">All</option>
                <option value="low">Low (&lt;= 5)</option>
                <option value="critical">Critical (&lt;= 2)</option>
              </select>
            </div>
            <Button
              className="h-9 bg-sky-500 text-white hover:bg-sky-600"
              onClick={() => {
                setPage(1);
                loadInventory();
              }}
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
        </DashboardCard>

        {/* Main Grid: Stock Table + Sidebar */}
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[2fr_1fr]">
          {/* Stock Summary Table */}
          <DashboardCard>
            <SectionHeader label="Inventory overview" title="Stock Summary" />
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50/60 text-left text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:bg-slate-900/30 dark:text-slate-500">
                  <tr>
                    <th className="px-5 py-2.5">Item</th>
                    <th className="px-5 py-2.5">SKU</th>
                    <th className="px-5 py-2.5">Category</th>
                    <th className="px-5 py-2.5 text-right">IN</th>
                    <th className="px-5 py-2.5 text-right">OUT</th>
                    <th className="px-5 py-2.5 text-right">Current</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {loading ? (
                    <tr>
                      <td className="px-5 py-8 text-center text-slate-400" colSpan={6}>
                        <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                      </td>
                    </tr>
                  ) : (stock?.data?.length ?? 0) === 0 ? (
                    <tr>
                      <td className="px-5 py-8 text-center text-slate-400" colSpan={6}>
                        Tidak ada data stok.
                      </td>
                    </tr>
                  ) : (
                    (stock?.data ?? []).map((row) => (
                      <tr
                        key={row.item_id}
                        className="transition-colors hover:bg-slate-50/60 dark:hover:bg-slate-800/30"
                      >
                        <td className="px-5 py-2.5 font-medium text-slate-700 dark:text-slate-200">
                          {row.name}
                        </td>
                        <td className="px-5 py-2.5 text-slate-500 dark:text-slate-400">
                          {row.sku ?? "-"}
                        </td>
                        <td className="px-5 py-2.5 text-slate-500 dark:text-slate-400">
                          {row.category ?? "-"}
                        </td>
                        <td className="px-5 py-2.5 text-right text-emerald-600 dark:text-emerald-400">
                          {row.total_in}
                        </td>
                        <td className="px-5 py-2.5 text-right text-rose-600 dark:text-rose-400">
                          {row.total_out}
                        </td>
                        <td className="px-5 py-2.5 text-right font-bold text-slate-800 dark:text-white">
                          {row.current_stock}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 dark:border-slate-800/60">
              <p className="text-xs text-slate-400">
                Page {stock?.page ?? 1} of {stock?.totalPages ?? 1}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={(stock?.page ?? 1) <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={(stock?.page ?? 1) >= (stock?.totalPages ?? 1)}
                  onClick={() =>
                    setPage((p) => Math.min(stock?.totalPages ?? p, p + 1))
                  }
                >
                  Next
                </Button>
              </div>
            </div>
          </DashboardCard>

          {/* Sidebar: Low Stock + Movements */}
          <div className="space-y-5">
            <DashboardCard>
              <SectionHeader label="Alert panel" title="Low Stock Alert" />
              <div className="max-h-72 overflow-auto p-3">
                {lowStock.length === 0 ? (
                  <p className="py-6 text-center text-sm text-slate-400">
                    Tidak ada item low stock.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {lowStock.map((item) => (
                      <div
                        key={item.item_id}
                        className="flex items-center justify-between rounded-xl border border-amber-200/60 bg-amber-50/50 px-3 py-2 dark:border-amber-900/50 dark:bg-amber-900/15"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">
                            {item.name}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {item.sku ?? "-"}
                          </p>
                        </div>
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                          <TriangleAlert className="h-3 w-3" />
                          {item.current_stock}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </DashboardCard>

            <DashboardCard>
              <SectionHeader label="Activity log" title="Recent Movements" />
              <div className="max-h-72 overflow-auto p-3">
                {(movements?.data ?? []).length === 0 ? (
                  <p className="py-6 text-center text-sm text-slate-400">
                    Belum ada pergerakan stok.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {(movements?.data ?? []).map((m) => (
                      <div
                        key={m.id}
                        className="rounded-xl border border-slate-100 px-3 py-2 dark:border-slate-800/60"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">
                            {m.item?.name ?? `Item #${m.item_id}`}
                          </p>
                          <span
                            className={cn(
                              "rounded px-2 py-0.5 text-[10px] font-bold",
                              m.type === "IN"
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                                : "bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
                            )}
                          >
                            {m.type} {m.quantity}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[11px] text-slate-400">
                          Ref: {m.reference_type ?? "manual"} #
                          {m.reference_id ?? "-"}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </DashboardCard>
          </div>
        </div>
      </div>
    </>
  );
}
