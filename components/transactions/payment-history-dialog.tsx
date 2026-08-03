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
import { Loader, History, Trash2 } from "lucide-react";
import type { SalePaymentWithMethod } from "@/lib/types/database";
import { formatRupiah } from "@/lib/data/items";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** sale atau purchase — menentukan endpoint API */
  type?: "sale" | "purchase";
  saleId: number;
  onPaymentDone: () => void;
};

export function PaymentHistoryDialog({ open, onOpenChange, type = "sale", saleId, onPaymentDone }: Props) {
  const [payments, setPayments] = useState<SalePaymentWithMethod[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const endpoint = type === "purchase"
    ? `/api/purchases/${saleId}/payments`
    : `/api/sales/${saleId}/payments`;

  useEffect(() => {
    if (!open || !saleId) return;
    let cancelled = false;

    // setState hanya di callback async — bukan sinkron di body effect
    (async () => {
      try {
        const res = await fetch(endpoint, { cache: "no-store" });
        if (cancelled) return;
        if (!res.ok) throw new Error("Gagal memuat riwayat pembayaran");
        const data = (await res.json()) as SalePaymentWithMethod[];
        setPayments(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Gagal memuat riwayat");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, saleId, endpoint]);

  async function handleDelete(paymentId: number) {
    if (!confirm("Yakin ingin menghapus pembayaran ini? Status utang akan dihitung ulang.")) return;
    try {
      const res = await fetch(`${endpoint}?paymentId=${paymentId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error ?? "Gagal menghapus pembayaran");
      }
      setPayments((prev) => prev.filter((p) => p.id !== paymentId));
      onPaymentDone();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menghapus pembayaran");
    }
  }

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-sky-100 dark:bg-sky-900/30">
              <History className="h-5 w-5 text-sky-600 dark:text-sky-400" />
            </div>
            <div>
              <DialogTitle className="text-lg">Riwayat Pembayaran</DialogTitle>
              <DialogDescription className="mt-0.5 text-sm">
                {payments.length > 0
                  ? `Total dibayar: ${formatRupiah(totalPaid)} · ${payments.length} pembayaran`
                  : "Belum ada pembayaran tercatat."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-2 max-h-80 overflow-y-auto pt-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader className="h-5 w-5 animate-spin text-sky-500" />
            </div>
          ) : error ? (
            <p className="text-center text-sm text-red-500 py-6">{error}</p>
          ) : payments.length === 0 ? (
            <p className="text-center text-sm text-slate-400 py-6">Belum ada pembayaran.</p>
          ) : (
            payments.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                    {formatRupiah(p.amount)}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {new Date(p.payment_date).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                    {p.payment_method?.name ? ` · ${p.payment_method.name}` : ""}
                    {p.notes ? ` · ${p.notes}` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(p.id)}
                  className="shrink-0 rounded-md p-1.5 text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 transition-colors"
                  aria-label="Hapus pembayaran"
                  title="Batalkan pembayaran"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="flex justify-end pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Tutup
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
