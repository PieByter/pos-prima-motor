"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Package, TriangleAlert } from "lucide-react";

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
  item?: {
    name: string;
    sku: string;
  };
};

type PaginatedMovements = {
  data: StockMovementRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

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

      <div className="space-y-6">
        <div className="grid grid-cols-4 gap-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Items (Filtered)
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
              {stock?.total ?? 0}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Current Stock (Page)
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
              {totalCurrentStock}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Low Stock Items
            </p>
            <p className="mt-2 text-2xl font-bold text-amber-600 dark:text-amber-400">
              {lowStock.length}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Recent Movements
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
              {movements?.total ?? 0}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-end gap-3">
            <div className="w-80 space-y-1.5">
              <label className="text-sm font-medium text-slate-600 dark:text-slate-300">
                Search Item
              </label>
              <Input
                placeholder="Cari nama item atau SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-600 dark:text-slate-300">
                Stock Status
              </label>
              <select
                className="h-9 w-44 rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900"
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
              className="bg-sky-500 text-white hover:bg-sky-600"
              onClick={() => {
                setPage(1);
                loadInventory();
              }}
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

        <div className="grid grid-cols-[2fr_1fr] gap-6">
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <div className="border-b border-slate-200 px-6 py-4 dark:border-slate-700">
              <h3 className="font-semibold text-slate-900 dark:text-white">Stock Summary</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900/40 dark:text-slate-400">
                  <tr>
                    <th className="px-6 py-3">Item</th>
                    <th className="px-6 py-3">SKU</th>
                    <th className="px-6 py-3">Category</th>
                    <th className="px-6 py-3 text-right">IN</th>
                    <th className="px-6 py-3 text-right">OUT</th>
                    <th className="px-6 py-3 text-right">Current</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {loading ? (
                    <tr>
                      <td className="px-6 py-10 text-center text-slate-500" colSpan={6}>
                        <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                      </td>
                    </tr>
                  ) : (stock?.data?.length ?? 0) === 0 ? (
                    <tr>
                      <td className="px-6 py-10 text-center text-slate-500" colSpan={6}>
                        Tidak ada data stok.
                      </td>
                    </tr>
                  ) : (
                    (stock?.data ?? []).map((row) => (
                      <tr key={row.item_id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                        <td className="px-6 py-3 font-medium text-slate-800 dark:text-slate-100">{row.name}</td>
                        <td className="px-6 py-3 text-slate-600 dark:text-slate-300">{row.sku ?? "-"}</td>
                        <td className="px-6 py-3 text-slate-600 dark:text-slate-300">{row.category ?? "-"}</td>
                        <td className="px-6 py-3 text-right text-emerald-600 dark:text-emerald-400">{row.total_in}</td>
                        <td className="px-6 py-3 text-right text-rose-600 dark:text-rose-400">{row.total_out}</td>
                        <td className="px-6 py-3 text-right font-semibold text-slate-900 dark:text-white">{row.current_stock}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 dark:border-slate-700">
              <p className="text-sm text-slate-500">
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
          </div>

          <div className="space-y-6">
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <div className="border-b border-slate-200 px-6 py-4 dark:border-slate-700">
                <h3 className="font-semibold text-slate-900 dark:text-white">Low Stock Alert</h3>
              </div>
              <div className="max-h-75 overflow-auto p-3">
                {lowStock.length === 0 ? (
                  <p className="py-8 text-center text-sm text-slate-500">Tidak ada item low stock.</p>
                ) : (
                  <div className="space-y-2">
                    {lowStock.map((item) => (
                      <div
                        key={item.item_id}
                        className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 dark:border-amber-900/70 dark:bg-amber-900/20"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{item.name}</p>
                          <p className="text-xs text-slate-500">{item.sku ?? "-"}</p>
                        </div>
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-900/60 dark:text-amber-300">
                          <TriangleAlert className="h-3.5 w-3.5" />
                          {item.current_stock}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <div className="border-b border-slate-200 px-6 py-4 dark:border-slate-700">
                <h3 className="font-semibold text-slate-900 dark:text-white">Recent Movements</h3>
              </div>
              <div className="max-h-75 overflow-auto p-3">
                {(movements?.data ?? []).length === 0 ? (
                  <p className="py-8 text-center text-sm text-slate-500">Belum ada pergerakan stok.</p>
                ) : (
                  <div className="space-y-2">
                    {(movements?.data ?? []).map((m) => (
                      <div key={m.id} className="rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                            {m.item?.name ?? `Item #${m.item_id}`}
                          </p>
                          <span
                            className={`rounded px-2 py-0.5 text-xs font-semibold ${
                              m.type === "IN"
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                                : "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300"
                            }`}
                          >
                            {m.type} {m.quantity}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          Ref: {m.reference_type ?? "manual"} #{m.reference_id ?? "-"}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
