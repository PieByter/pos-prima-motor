"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Wallet, History } from "lucide-react";
import { PaymentDialog } from "./payment-dialog";
import { PaymentHistoryDialog } from "./payment-history-dialog";

type Props = {
  saleId: number;
  invoiceNumber: string;
  totalAmount: number;
  paidAmount: number;
  paymentStatus: string;
};

/** Aksi pembayaran utang di halaman detail penjualan (client component) */
export function SalePaymentActions({
  saleId,
  invoiceNumber,
  totalAmount,
  paidAmount,
  paymentStatus,
}: Props) {
  const router = useRouter();
  const [payOpen, setPayOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const hasDebt = paymentStatus === "partial" || paymentStatus === "unpaid";

  function handlePaymentDone() {
    router.refresh();
  }

  return (
    <>
      {hasDebt && (
        <Button
          className="gap-2 bg-emerald-500 hover:bg-emerald-600 text-white"
          onClick={() => setPayOpen(true)}
        >
          <Wallet className="h-4 w-4" />
          Terima Pembayaran
        </Button>
      )}
      <Button
        variant="outline"
        className="gap-2"
        onClick={() => setHistoryOpen(true)}
      >
        <History className="h-4 w-4" />
        Riwayat Pembayaran
      </Button>

      <PaymentDialog
        open={payOpen}
        onOpenChange={setPayOpen}
        saleId={saleId}
        invoiceNumber={invoiceNumber}
        totalAmount={totalAmount}
        paidAmount={paidAmount}
        onPaymentDone={handlePaymentDone}
      />
      <PaymentHistoryDialog
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        saleId={saleId}
        onPaymentDone={handlePaymentDone}
      />
    </>
  );
}
