"use client";

import { useEffect, useState } from "react";
import { Loader2, Printer } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Receipt } from "@/components/transactions/receipt";
import {
  mapSaleToInvoice,
  type InvoiceDetail,
} from "@/lib/data/invoice-details";
import { useLocale } from "@/lib/locales";

interface ReceiptReprintDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  saleId: number;
  invoiceNumber: string;
}

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; invoice: InvoiceDetail };

/**
 * Isi dialog cetak ulang. Di-key oleh saleId agar state selalu fresh
 * setiap kali membuka struk yang berbeda (tanpa setState sinkron di effect).
 */
function ReceiptReprintContent({
  saleId,
}: {
  saleId: number;
}) {
  const { t } = useLocale();
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const res = await fetch(`/api/sales/${saleId}`, { cache: "no-store" });
        if (!res.ok) throw new Error(t("receipt.loadFailed"));
        const data = await res.json();
        if (active) setState({ status: "ready", invoice: mapSaleToInvoice(data) });
      } catch (err) {
        if (active) {
          setState({
            status: "error",
            message: err instanceof Error ? err.message : t("receipt.loadFailed"),
          });
        }
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [saleId, t]);

  if (state.status === "loading") {
    return (
      <div className="flex items-center justify-center py-12 text-slate-500">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (state.status === "error") {
    return <p className="py-12 text-center text-sm text-red-500">{state.message}</p>;
  }

  return <Receipt invoice={state.invoice} />;
}

/**
 * Dialog cetak ulang struk dari riwayat penjualan.
 * Mengambil detail penjualan via API lalu menampilkan Receipt (dengan opsi
 * ukuran kertas 58/80mm & jumlah salinan) untuk dicetak.
 */
export function ReceiptReprintDialog({
  open,
  onOpenChange,
  saleId,
  invoiceNumber,
}: ReceiptReprintDialogProps) {
  const { t } = useLocale();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="h-4 w-4" />
            {t("receipt.reprint")} — {invoiceNumber}
          </DialogTitle>
          <DialogDescription>{t("receipt.reprintDesc")}</DialogDescription>
        </DialogHeader>
        <div className="max-h-[70vh] overflow-auto">
          {open && (
            <ReceiptReprintContent key={saleId} saleId={saleId} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}