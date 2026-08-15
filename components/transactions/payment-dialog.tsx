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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader, Wallet } from "lucide-react";
import { formatRupiah } from "@/lib/data/items";
import { useLocale } from "@/lib/locales";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** sale atau purchase — menentukan endpoint API */
  type?: "sale" | "purchase";
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
  type = "sale",
  saleId,
  invoiceNumber,
  totalAmount,
  paidAmount,
  onPaymentDone,
}: Props) {
  const { t } = useLocale();
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentMethodId, setPaymentMethodId] = useState("");
  const [paymentMethods, setPaymentMethods] = useState<{ id: number; name: string }[]>([]);

  // Load metode bayar saat dialog terbuka
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    fetch("/api/payment-methods", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : []))
      .then((list) => {
        if (!cancelled) {
          setPaymentMethods(Array.isArray(list) ? list.filter((m: { is_active: boolean }) => m.is_active) : []);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [open]);

  const remaining = Math.max(0, totalAmount - paidAmount);
  const endpoint = type === "purchase"
    ? `/api/purchases/${saleId}/payments`
    : `/api/sales/${saleId}/payments`;

  function handleQuickFill() {
    setAmount(String(remaining));
  }

  async function handleSubmit() {
    const value = Number(amount);
    if (!value || value <= 0) {
      setError(t("transactions.invalidPaymentAmount"));
      return;
    }
    if (value > remaining) {
      setError(t("transactions.paymentExceeds", { remaining: formatRupiah(remaining) }));
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: value,
          notes: notes.trim() || null,
          payment_method_id: paymentMethodId ? Number(paymentMethodId) : null,
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error ?? t("transactions.paymentSaveFailed"));
      }
      setAmount("");
      setNotes("");
      onOpenChange(false);
      onPaymentDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("transactions.paymentSaveFailed"));
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
              <DialogTitle className="text-lg">{t("transactions.receivePayment")}</DialogTitle>
              <DialogDescription className="mt-0.5 text-sm">
                {invoiceNumber} · {t("transactions.remainingBalance")}{" "}
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
              {t("transactions.amountPaid")} <span className="text-red-500">*</span>
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
                {t("transactions.paidInFull")}
              </Button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t("transactions.paymentSummaryLine", { total: formatRupiah(totalAmount), paid: formatRupiah(paidAmount) })}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="payment-method" className="text-sm font-medium">
              {t("transactions.paymentMethod")}
            </Label>
            <Select value={paymentMethodId} onValueChange={setPaymentMethodId}>
              <SelectTrigger>
                <SelectValue placeholder={t("transactions.paymentMethodPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.map((m) => (
                  <SelectItem key={m.id} value={String(m.id)}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="payment-notes" className="text-sm font-medium">
              {t("transactions.notesOptional")}
            </Label>
            <Input
              id="payment-notes"
              placeholder={t("transactions.paymentNotesPlaceholder")}
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
              {t("common.cancel")}
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-emerald-500 hover:bg-emerald-600 text-white gap-2"
            >
              {isSubmitting && <Loader className="h-4 w-4 animate-spin" />}
              {t("transactions.savePayment")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
