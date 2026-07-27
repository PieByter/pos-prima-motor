"use client";

import { useCallback, useEffect, useState } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/lib/toast-provider";
import { Search, Package, CheckCircle, Loader2, ClipboardCheck, AlertTriangle } from "lucide-react";

type StockItem = {
  id: number;
  name: string;
  sku: string | null;
  current_stock: number;
};

export default function StockOpnamePage() {
  const { showToast } = useToast();
  const [items, setItems] = useState<StockItem[]>([]);
  const [search, setSearch] = useState("");
  const [physicalStocks, setPhysicalStocks] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState(false);
  const [completed, setCompleted] = useState<number[]>([]);

  useEffect(() => {
    fetch("/api/items?page=1&limit=500", { cache: "no-store" })
      .then((r) => r.json())
      .then((json) => {
        const rows = json?.data ?? [];
        setItems(rows.map((r: any) => ({
          id: r.id,
          name: r.name,
          sku: r.sku,
          current_stock: r.stock ?? r.current_stock ?? 0,
        })));
      })
      .catch(() => {});
  }, []);

  const filteredItems = items.filter(
    (i) =>
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      (i.sku && i.sku.toLowerCase().includes(search.toLowerCase())),
  );

  const handleSaveOpname = useCallback(async (itemId: number) => {
    const physicalStr = physicalStocks[itemId];
    if (!physicalStr) return;

    const physicalStock = parseInt(physicalStr, 10);
    if (isNaN(physicalStock) || physicalStock < 0) return;

    const item = items.find((i) => i.id === itemId);
    if (!item) return;

    const difference = physicalStock - item.current_stock;
    if (difference === 0) {
      setCompleted((prev) => [...prev, itemId]);
      showToast(`${item.name}: stok sesuai`, "success");
      return;
    }

    try {
      const res = await fetch("/api/stock/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          item_id: itemId,
          type: difference > 0 ? "IN" : "OUT",
          quantity: Math.abs(difference),
          reason: `Stok opname: fisik ${physicalStock}, sistem ${item.current_stock}`,
        }),
      });

      if (!res.ok) throw new Error("Gagal");

      // Update local state
      setItems((prev) =>
        prev.map((i) =>
          i.id === itemId ? { ...i, current_stock: physicalStock } : i,
        ),
      );
      setCompleted((prev) => [...prev, itemId]);
      showToast(`${item.name}: ${difference > 0 ? "+" : ""}${difference} (${item.current_stock} → ${physicalStock})`, "success");
    } catch {
      showToast(`Gagal opname ${item.name}`, "error");
    }
  }, [physicalStocks, items, showToast]);

  const totalToCount = filteredItems.length;
  const totalCounted = completed.length;

  return (
    <>
      <Navbar title="Stok Opname" subtitle="Cocokkan stok fisik dengan sistem." />
      <div className="space-y-4">
        {/* Summary */}
        <div className="flex flex-wrap items-center gap-4 rounded-xl border bg-white p-4 dark:bg-slate-800">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-emerald-500" />
            <span className="text-sm">
              Terhitung: <strong>{totalCounted}</strong> / {totalToCount} item
            </span>
          </div>
          {totalCounted > 0 && (
            <div className="h-2 flex-1 min-w-32 max-w-xs rounded-full bg-slate-200 dark:bg-slate-700">
              <div
                className="h-2 rounded-full bg-emerald-500 transition-all"
                style={{ width: `${(totalCounted / Math.max(totalToCount, 1)) * 100}%` }}
              />
            </div>
          )}
        </div>

        {/* Search */}
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Cari barang..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Items */}
        <div className="rounded-xl border bg-white dark:bg-slate-800 divide-y">
          {filteredItems.length === 0 ? (
            <p className="p-6 text-center text-sm text-slate-400">Tidak ada item.</p>
          ) : (
            filteredItems.map((item) => {
              const isCounted = completed.includes(item.id);
              const physicalStr = physicalStocks[item.id] ?? "";
              const physicalNum = parseInt(physicalStr, 10);
              const diff = isNaN(physicalNum) ? 0 : physicalNum - item.current_stock;
              const hasDiff = !isNaN(physicalNum) && diff !== 0;

              return (
                <div key={item.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/30">
                  {isCounted ? (
                    <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />
                  ) : (
                    <Package className="h-5 w-5 text-slate-300 shrink-0" />
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                      {item.name}
                    </p>
                    <p className="text-xs text-slate-400">
                      SKU: {item.sku ?? "-"} | Sistem: <strong>{item.current_stock}</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="w-20">
                      <Input
                        type="number"
                        min={0}
                        placeholder="Fisik"
                        value={physicalStr}
                        onChange={(e) =>
                          setPhysicalStocks((prev) => ({
                            ...prev,
                            [item.id]: e.target.value,
                          }))
                        }
                        className="h-8 text-sm text-center"
                        disabled={isCounted}
                      />
                    </div>

                    {hasDiff && !isCounted && (
                      <Badge variant="outline" className={diff > 0 ? "text-emerald-600 border-emerald-200" : "text-red-600 border-red-200"}>
                        {diff > 0 ? "+" : ""}{diff}
                      </Badge>
                    )}

                    {physicalStr && !isCounted && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 text-xs"
                        onClick={() => handleSaveOpname(item.id)}
                      >
                        <CheckCircle className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
