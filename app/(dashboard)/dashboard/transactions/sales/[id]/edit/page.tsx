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

export default function EditSalePage() {
  const params = useParams<{ id: string }>();
  const [initialData, setInitialData] = useState<TransactionFormData | null>(null);
  const [invoiceNumber, setInvoiceNumber] = useState<string>(`INV-${params.id}`);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSale = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/sales/${params.id}`, { cache: "no-store" });
        if (!response.ok) throw new Error("Sale not found");

        const sale = await response.json();
        setInvoiceNumber(String(sale.invoice_number ?? `INV-${params.id}`));

        const mapped: TransactionFormData = {
          customer: sale.customer?.name ?? "",
          mechanicId: sale.mechanic_id ?? null,
          date: sale.sale_date ?? new Date().toISOString().slice(0, 10),
          notes: "",
          items: (sale.details ?? []).map((item: Record<string, unknown>, idx: number): FormLineItem => ({
            key: idx + 1,
            itemId: Number(item.item_id),
            name: String((item.item as { name?: string } | undefined)?.name ?? ""),
            qty: Number(item.quantity ?? 1),
            unitPrice: Number(item.base_price ?? 0),
            discountPercent:
              Number(item.base_price ?? 0) * Number(item.quantity ?? 1) > 0
                ? Math.round((Number(item.discount_amount ?? 0) / (Number(item.base_price ?? 0) * Number(item.quantity ?? 1))) * 100)
                : 0,
            serviceFee: Number(item.service_fee ?? 0),
            subtotal: Number(item.subtotal ?? 0),
          })),
        };

        setInitialData(mapped);
      } catch (error) {
        console.error("Failed to load sale detail:", error);
        setInitialData(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadSale();
  }, [params.id]);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-slate-500">
        <span className="inline-flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading sale...
        </span>
      </div>
    );
  }

  if (!initialData) {
    return <div className="p-6 text-sm text-red-500">Invoice penjualan tidak ditemukan.</div>;
  }

  return (
    <>
      <Navbar
        title="Edit Penjualan"
        subtitle={`Edit invoice ${invoiceNumber}`}
      />
      <TransactionForm
        type="sale"
        initialData={initialData}
        transactionId={invoiceNumber}
      />
    </>
  );
}
