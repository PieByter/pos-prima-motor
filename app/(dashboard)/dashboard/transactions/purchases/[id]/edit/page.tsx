"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import {
  TransactionForm,
  type TransactionFormData,
  type FormLineItem,
} from "@/components/transactions/transaction-form";
import { Loader2 } from "lucide-react";

export default function EditPurchasePage() {
  const params = useParams<{ id: string }>();
  const [initialData, setInitialData] = useState<TransactionFormData | null>(null);
  const [invoiceNumber, setInvoiceNumber] = useState<string>(`PO-${params.id}`);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPurchase = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/purchases/${params.id}`, {
          cache: "no-store",
        });
        if (!response.ok) throw new Error("Purchase not found");

        const purchase = await response.json();
        setInvoiceNumber(String(purchase.invoice_number ?? `PO-${params.id}`));

        const mapped: TransactionFormData = {
          customer: purchase.supplier?.name ?? "",
          mechanicId: null,
          date: purchase.purchase_date ?? new Date().toISOString().slice(0, 10),
          notes: "",
          items: (purchase.details ?? []).map((item: Record<string, unknown>, idx: number): FormLineItem => ({
            key: idx + 1,
            itemId: Number(item.item_id),
            name: String((item.item as { name?: string } | undefined)?.name ?? ""),
            qty: Number(item.quantity ?? 1),
            unitPrice: Number(item.price ?? 0),
            discountPercent: 0,
            serviceFee: 0,
            subtotal: Number(item.subtotal ?? 0),
          })),
        };

        setInitialData(mapped);
      } catch (error) {
        console.error("Failed to load purchase detail:", error);
        setInitialData(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadPurchase();
  }, [params.id]);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-slate-500">
        <span className="inline-flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading purchase...
        </span>
      </div>
    );
  }

  if (!initialData) {
    return <div className="p-6 text-sm text-red-500">Invoice pembelian tidak ditemukan.</div>;
  }

  return (
    <>
      <Navbar
        title="Edit Pembelian"
        subtitle={`Edit invoice ${invoiceNumber}`}
      />
      <TransactionForm
        type="purchase"
        initialData={initialData}
        transactionId={invoiceNumber}
      />
    </>
  );
}
