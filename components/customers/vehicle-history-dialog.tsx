"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Bike, History, Loader2, Wrench, Package } from "lucide-react";
import type { Vehicle } from "@/lib/types/database";
import { formatRupiah } from "@/lib/data/items";
import type { VehicleServiceHistoryEntry } from "@/lib/services/vehicles.service";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicle: Vehicle | null;
};

const SALE_TYPE_LABEL: Record<string, string> = {
  purchase: "🛒 Beli",
  service: "🔧 Service",
  hybrid: "⚙️ Hybrid",
};

function saleTypeClass(type: string) {
  if (type === "service") return "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300";
  if (type === "hybrid") return "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/30 dark:text-fuchsia-300";
  return "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300";
}

function paymentStatusClass(status: string) {
  if (status === "unpaid") return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
  if (status === "partial") return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300";
  return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300";
}

const PAYMENT_STATUS_LABEL: Record<string, string> = {
  paid: "Lunas",
  partial: "Sebagian",
  unpaid: "Utang",
};

export function VehicleHistoryDialog({ open, onOpenChange, vehicle }: Props) {
  const [entries, setEntries] = useState<VehicleServiceHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !vehicle) return;
    let cancelled = false;

    // Jangan setState sinkron di body effect — state awal sudah cukup,
    // setState hanya di callback async setelah fetch.
    (async () => {
      try {
        const res = await fetch(`/api/vehicles/history?vehicle_id=${vehicle.id}`, {
          cache: "no-store",
        });
        if (cancelled) return;
        if (!res.ok) throw new Error("Gagal memuat riwayat");
        const data = (await res.json()) as VehicleServiceHistoryEntry[];
        setEntries(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Gagal memuat riwayat");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, vehicle]);

  const totalSpent = entries.reduce((sum, e) => sum + e.total_amount, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col p-0">
        <DialogHeader className="p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-sky-100 dark:bg-sky-900/30">
              <History className="h-5 w-5 text-sky-600 dark:text-sky-400" />
            </div>
            <div>
              <DialogTitle className="text-lg">Riwayat Service Motor</DialogTitle>
              <DialogDescription className="mt-0.5 text-sm">
                {vehicle
                  ? `${vehicle.plate_number}${vehicle.model ? ` · ${vehicle.model}` : ""}`
                  : ""}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Ringkasan */}
          {!isLoading && entries.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 p-3 text-center">
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {entries.length}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Transaksi</p>
              </div>
              <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 p-3 text-center">
                <p className="text-2xl font-bold text-sky-600 dark:text-sky-400">
                  {formatRupiah(totalSpent)}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Total Belanja</p>
              </div>
              <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 p-3 text-center">
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {entries.filter((e) => e.service_fee_total > 0).length}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Kali Service</p>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-sky-500" />
            </div>
          ) : error ? (
            <p className="text-center text-sm text-red-500 py-8">{error}</p>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-slate-400">
              <Bike className="h-10 w-10 mb-2 opacity-30" />
              <p className="text-sm font-medium">Belum ada transaksi untuk motor ini</p>
            </div>
          ) : (
            <div className="space-y-3">
              {entries.map((e) => (
                <div
                  key={e.id}
                  className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden"
                >
                  {/* Header transaksi */}
                  <div className="flex items-center justify-between gap-2 px-4 py-3 bg-slate-50 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm font-semibold text-sky-600 dark:text-sky-400 truncate">
                        {e.invoice_number}
                      </span>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${saleTypeClass(e.sale_type)}`}
                      >
                        {SALE_TYPE_LABEL[e.sale_type] ?? "Transaksi"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {new Date(e.sale_date).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${paymentStatusClass(e.payment_status)}`}
                      >
                        {PAYMENT_STATUS_LABEL[e.payment_status] ?? "—"}
                      </span>
                    </div>
                  </div>

                  {/* Item detail */}
                  <div className="px-4 py-3 space-y-1.5">
                    {e.items.length === 0 ? (
                      <p className="text-xs text-slate-400">Tanpa item</p>
                    ) : (
                      e.items.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between gap-2 text-sm">
                          <span className="inline-flex items-center gap-1.5 text-slate-700 dark:text-slate-300 min-w-0">
                            {item.service_fee > 0 ? (
                              <Wrench className="h-3.5 w-3.5 text-violet-500 shrink-0" />
                            ) : (
                              <Package className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            )}
                            <span className="truncate">{item.name}</span>
                            <span className="text-xs text-slate-400 shrink-0">×{item.quantity}</span>
                          </span>
                          {item.service_fee > 0 && (
                            <span className="text-xs text-violet-600 dark:text-violet-400 shrink-0">
                              jasa {formatRupiah(item.service_fee)}
                            </span>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  {/* Total */}
                  <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 dark:bg-slate-900/40 border-t border-slate-200 dark:border-slate-700">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Total</span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {formatRupiah(e.total_amount)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Tutup
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
