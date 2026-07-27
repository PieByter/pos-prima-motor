"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, TrendingUp, TrendingDown, Minus } from "lucide-react";

type PriceLog = {
  id: number;
  item_id: number;
  field: string;
  old_price: number;
  new_price: number;
  changed_by: string | null;
  created_at: string;
  items?: { name: string; sku: string | null };
};

const FIELD_LABELS: Record<string, string> = {
  purchase_price: "Harga Beli",
  selling_price: "Harga Jual",
  service_fee: "Fee Service",
};

export default function PriceHistoryPage() {
  const [logs, setLogs] = useState<PriceLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [field, setField] = useState("all");

  useEffect(() => {
    const fetchLogs = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({ limit: "100" });
        if (field !== "all") params.append("field", field);
        const res = await fetch(`/api/reports/price-history?${params}`);
        if (res.ok) {
          const json = await res.json();
          setLogs(json?.data ?? []);
        }
      } catch { /* ignore */ } finally {
        setIsLoading(false);
      }
    };
    fetchLogs();
  }, [field]);

  const filteredLogs = logs.filter(
    (l) =>
      !search ||
      l.items?.name?.toLowerCase().includes(search.toLowerCase()) ||
      l.items?.sku?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <>
      <Navbar title="Riwayat Harga" subtitle="Catatan perubahan harga barang." />
      <div className="space-y-4">
        {/* Filters */}
        <div className="flex gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Cari barang..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={field} onValueChange={setField}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Semua" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Field</SelectItem>
              <SelectItem value="purchase_price">Harga Beli</SelectItem>
              <SelectItem value="selling_price">Harga Jual</SelectItem>
              <SelectItem value="service_fee">Fee Service</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-xl border bg-white dark:bg-slate-800">
          {isLoading ? (
            <div className="space-y-3 p-4"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>
          ) : filteredLogs.length === 0 ? (
            <p className="p-6 text-center text-sm text-slate-400">Belum ada riwayat perubahan harga.</p>
          ) : (
            <div className="divide-y">
              {filteredLogs.map((log) => {
                const diff = log.new_price - log.old_price;
                const isUp = diff > 0;
                const isDown = diff < 0;
                return (
                  <div key={log.id} className="flex items-center gap-4 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/30">
                    <div className={`p-1.5 rounded-lg ${
                      isUp ? "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400" :
                      isDown ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400" :
                      "bg-slate-100 text-slate-400"
                    }`}>
                      {isUp ? <TrendingUp className="h-4 w-4" /> : isDown ? <TrendingDown className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        {log.items?.name ?? "Unknown"}
                        {log.items?.sku && <span className="ml-2 text-xs text-slate-400">{log.items.sku}</span>}
                      </p>
                      <p className="text-xs text-slate-400">
                        {FIELD_LABELS[log.field] || log.field}:
                        <span className="line-through ml-1">Rp {Number(log.old_price).toLocaleString("id-ID")}</span>
                        <span className="ml-1 font-semibold">Rp {Number(log.new_price).toLocaleString("id-ID")}</span>
                      </p>
                    </div>
                    <div className="text-right text-xs text-slate-400 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleDateString("id-ID")}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
