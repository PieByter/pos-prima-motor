"use client";

import { useCallback, useEffect, useState } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader, ChevronLeft, ChevronRight } from "lucide-react";
import type { StockAdjustmentWithItem, PaginatedResponse } from "@/lib/types/database";

const ITEMS_PER_PAGE = 10;

const reasonLabels: Record<string, string> = {
  damaged: "Barang Rusak",
  lost: "Barang Hilang",
  count_fix: "Stok Opname",
  stock_in: "Stok Masuk",
  other: "Lainnya",
};

export function StockAdjustmentsHistoryPage() {
  const [adjustments, setAdjustments] = useState<StockAdjustmentWithItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAdjustments = useCallback(async (page = currentPage) => {
    try {
      const res = await fetch(`/api/stock-adjustments?page=${page}&limit=${ITEMS_PER_PAGE}`, { cache: "no-store" });
      const result = (await res.json()) as PaginatedResponse<StockAdjustmentWithItem>;
      setAdjustments(result.data ?? []);
      setTotalPages(result.totalPages ?? 1);
    } catch {
      setAdjustments([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      void fetchAdjustments();
    }, 0);
    return () => window.clearTimeout(t);
  }, [fetchAdjustments]);

  return (
    <>
      <Navbar
        title="Riwayat Penyesuaian Stok"
        subtitle="Semua catatan stok opname, barang rusak, hilang, dan stok masuk manual."
      />
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 dark:bg-slate-800/60">
                <TableHead className="px-5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Tanggal</TableHead>
                <TableHead className="px-5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Item</TableHead>
                <TableHead className="px-5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Tipe</TableHead>
                <TableHead className="px-5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right">Jumlah</TableHead>
                <TableHead className="px-5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Alasan</TableHead>
                <TableHead className="px-5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Keterangan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="py-16 text-center">
                  <Loader className="h-7 w-7 animate-spin text-sky-500 mx-auto" />
                </TableCell></TableRow>
              ) : adjustments.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="py-16 text-center text-sm text-slate-400">
                  Belum ada penyesuaian stok
                </TableCell></TableRow>
              ) : (
                adjustments.map((a) => (
                  <TableRow key={a.id} className="border-slate-100 dark:border-slate-800">
                    <TableCell className="px-5 text-sm text-slate-500">
                      {new Date(a.adjustment_date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                    </TableCell>
                    <TableCell className="px-5">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{a.item?.name ?? "—"}</p>
                      {a.item?.sku && <p className="text-xs text-slate-400">{a.item.sku}</p>}
                    </TableCell>
                    <TableCell className="px-5">
                      <Badge
                        variant="secondary"
                        className={`text-[10px] px-1.5 py-0 border ${
                          a.type === "IN"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800"
                            : "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800"
                        }`}
                      >
                        {a.type === "IN" ? "Masuk" : "Keluar"}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-5 text-right">
                      <span className={`text-sm font-mono font-semibold ${a.type === "IN" ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                        {a.type === "IN" ? "+" : "-"}{a.quantity}
                      </span>
                    </TableCell>
                    <TableCell className="px-5 text-sm text-slate-600 dark:text-slate-300">
                      {reasonLabels[a.reason] ?? a.reason}
                    </TableCell>
                    <TableCell className="px-5 text-sm text-slate-400 max-w-48 truncate">
                      {a.notes ?? "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-200 dark:border-slate-800">
            <p className="text-xs text-slate-500">Halaman {currentPage} dari {totalPages}</p>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setCurrentPage((p) => p - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setCurrentPage((p) => p + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
