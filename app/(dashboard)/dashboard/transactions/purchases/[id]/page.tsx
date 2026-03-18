import { notFound } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { TransactionDetail } from "@/components/transactions/transaction-detail";
import type { InvoiceDetail } from "@/lib/data/invoice-details";
import { createClient } from "@/lib/supabase/server";
import { getPurchaseById } from "@/lib/services/purchases.service";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function PurchaseDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: purchase } = await getPurchaseById(supabase, Number(id));

  if (!purchase) {
    notFound();
  }

  const invoice: InvoiceDetail = {
    id: purchase.id,
    invoiceNumber: purchase.invoice_number,
    status:
      purchase.status === "completed"
        ? "Completed"
        : purchase.status === "pending"
          ? "Pending"
          : "Cancelled",
    createdAt: new Date(purchase.created_at).toLocaleString("id-ID"),
    transactionType: "purchase",
    entityName: purchase.supplier?.name ?? "Unknown Supplier",
    entityPhone: purchase.supplier?.phone ?? "-",
    mechanicName: "-",
    mechanicStation: "-",
    jobStart: "-",
    jobEnd: "-",
    paymentMethod: "-",
    transactionId: purchase.invoice_number,
    items: (purchase.details ?? []).map((d) => ({
      id: d.id,
      name: d.item?.name ?? "Item",
      description: d.item?.description ?? "",
      type: "Part",
      unitPrice: d.price,
      qty: d.quantity,
      discount: 0,
      subtotal: d.subtotal,
      icon: "package",
    })),
    subtotal: (purchase.details ?? []).reduce((sum, d) => sum + d.subtotal, 0),
    totalDiscount: 0,
    taxPercent: 0,
    taxAmount: 0,
    grandTotal: purchase.total_amount,
    createdBy: purchase.created_by,
  };

  return (
    <>
      <Navbar
        title="Detail Pembelian"
        subtitle="Detail invoice pembelian barang"
      />
      <div className="flex-1 overflow-auto p-6">
        <TransactionDetail
          invoice={invoice}
          backHref="/dashboard/transactions/purchases"
        />
      </div>
    </>
  );
}
