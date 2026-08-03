"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader, Wallet } from "lucide-react";
import { formatRupiah } from "@/lib/data/items";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  saleId: number;
  invoiceNumber: string;
  totalAmount: number;
  paidAmount: number;
  /** Dipanggil setelah pembayaran berhasil */
  onPaymentDone: () => void;
};

export function PaymentDialog({
  open,
  onOpenChange,
  saleId,
  invoiceNumber,
  totalAmount,
  paidAmount,
  onPaymentDone,
}: Props) {
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remaining = Math.max(0, totalAmount - paidAmount);

  function handleQuickFill() {
    setAmount(String(remaining));
  }

  async function handleSubmit() {
    const value = Number(amount);
    if (!value || value <= 0) {
      setError("Masukkan jumlah pembayaran yang valid.");
      return;
    }
    if (value > remaining) {
      setError(`Jumlah melebihi sisa tagihan (${formatRupiah(remaining)}).`);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/sales/${saleId}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: value,
          notes: notes.trim() || null,
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error ?? "Gagal menyimpan pembayaran");
      }
      setAmount("");
      setNotes("");
      onOpenChange(false);
      onPaymentDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan pembayaran");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
              <Wallet className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <DialogTitle className="text-lg">Terima Pembayaran</DialogTitle>
              <DialogDescription className="mt-0.5 text-sm">
                {invoiceNumber} · Sisa tagihan{" "}
                <span className="font-semibold text-amber-600 dark:text-amber-400">
                  {formatRupiah(remaining)}
                </span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="payment-amount" className="text-sm font-medium">
              Jumlah Dibayar <span className="text-red-500">*</span>
            </Label>
            <div className="flex gap-2">
              <Input
                id="payment-amount"
                type="number"
                min={0}
                max={remaining}
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="text-right"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleQuickFill}
                className="shrink-0"
              >
                Lunas
              </Button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Total: {formatRupiah(totalAmount)} · Sudah dibayar: {formatRupiah(paidAmount)}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="payment-notes" className="text-sm font-medium">
              Catatan (opsional)
            </Label>
            <Input
              id="payment-notes"
              placeholder="Contoh: Bayar DP, angsuran ke-2..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-emerald-500 hover:bg-emerald-600 text-white gap-2"
            >
              {isSubmitting && <Loader className="h-4 w-4 animate-spin" />}
              Simpan Pembayaran
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
