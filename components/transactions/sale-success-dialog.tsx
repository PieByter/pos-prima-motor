"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, MessageCircle, Eye, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  mapSaleToInvoice,
  type InvoiceDetail,
} from "@/lib/data/invoice-details";
import { openWhatsAppReceipt } from "@/lib/utils/whatsapp";
import { useLocale } from "@/lib/locales";
import { useToast } from "@/lib/toast-provider";

interface SaleSuccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  saleId: number;
  invoiceNumber: string;
  backHref: string;
}

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; invoice: InvoiceDetail };

/**
 * Isi dialog sukses penjualan. Di-key oleh saleId agar state selalu fresh
 * setiap kali transaksi baru disimpan (tanpa setState sinkron di effect).
 * Menampilkan tombol "Kirim Struk via WA" — mengirim struk digital ke
 * WhatsApp customer lewat link wa.me (kasir tinggal tekan kirim).
 */
function SaleSuccessContent({
  saleId,
  invoiceNumber,
  onView,
  onDone,
}: {
  saleId: number;
  invoiceNumber: string;
  onView: () => void;
  onDone: () => void;
}) {
  const { t } = useLocale();
  const { showToast } = useToast();
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const res = await fetch(`/api/sales/${saleId}`, { cache: "no-store" });
        if (!res.ok) throw new Error("load failed");
        const data = await res.json();
        if (active) setState({ status: "ready", invoice: mapSaleToInvoice(data) });
      } catch {
        if (active) setState({ status: "error", message: t("receipt.loadFailed") });
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [saleId, t]);

  function handleWhatsApp() {
    if (state.status !== "ready") return;
    if (!state.invoice.entityPhone || state.invoice.entityPhone === "-") {
      showToast(t("transactions.customerNoPhone"), "error");
      return;
    }
    const ok = openWhatsAppReceipt(state.invoice);
    if (!ok) showToast(t("transactions.invalidPhone"), "error");
  }

  if (state.status === "loading") {
    return (
      <div className="flex items-center justify-center py-12 text-slate-500">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="space-y-4">
        <p className="text-sm text-red-500">{state.message}</p>
        <div className="flex justify-end">
          <Button onClick={onDone}>{t("common.done")}</Button>
        </div>
      </div>
    );
  }

  const invoice = state.invoice;
  const hasPhone = !!invoice.entityPhone && invoice.entityPhone !== "-";

  return (
    <div className="space-y-5">
      <div className="flex flex-col items-center text-center gap-2">
        <CheckCircle2 className="h-12 w-12 text-emerald-500" />
        <p className="text-lg font-semibold text-slate-900 dark:text-white">
          {t("transactions.saleSuccess")}
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {t("transactions.invoiceNumber")}:{" "}
          <span className="font-semibold text-slate-800 dark:text-slate-200">{invoiceNumber}</span>
        </p>
        <p className="text-xs text-slate-400">
          {t("transactions.grandTotal")}:{" "}
          <span className="font-semibold text-slate-600 dark:text-slate-300">
            {invoice.grandTotal.toLocaleString("id-ID", { style: "currency", currency: "IDR" })}
          </span>
        </p>
      </div>

      <DialogDescription className="text-center text-sm text-slate-500 dark:text-slate-400">
        {hasPhone
          ? t("transactions.sendStrukHint")
          : t("transactions.sendStrukNoPhone")}
      </DialogDescription>

      <DialogFooter className="gap-2 sm:justify-center">
        {hasPhone && (
          <Button
            variant="default"
            className="gap-2 bg-emerald-600 hover:bg-emerald-700"
            onClick={handleWhatsApp}
          >
            <MessageCircle className="h-4 w-4" />
            {t("transactions.sendWhatsApp")}
          </Button>
        )}
        <Button variant="outline" className="gap-2" onClick={onView}>
          <Eye className="h-4 w-4" />
          {t("transactions.viewDetail")}
        </Button>
        <Button variant="ghost" onClick={onDone}>
          {t("common.done")}
        </Button>
      </DialogFooter>
    </div>
  );
}

export function SaleSuccessDialog({
  open,
  onOpenChange,
  saleId,
  invoiceNumber,
  backHref,
}: SaleSuccessDialogProps) {
  const router = useRouter();

  function handleView() {
    router.push(`/dashboard/transactions/sales/${saleId}`);
    router.refresh();
  }

  function handleDone() {
    onOpenChange(false);
    router.push(backHref);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="sr-only">
            {invoiceNumber}
          </DialogTitle>
        </DialogHeader>
        <SaleSuccessContent
          saleId={saleId}
          invoiceNumber={invoiceNumber}
          onView={handleView}
          onDone={handleDone}
        />
      </DialogContent>
    </Dialog>
  );
}
