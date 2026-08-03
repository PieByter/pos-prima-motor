import { notFound } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { TransactionDetail } from "@/components/transactions/transaction-detail";
import { SalePaymentActions } from "@/components/transactions/sale-payment-actions";
import type { InvoiceDetail } from "@/lib/data/invoice-details";
import { getSaleById } from "@/lib/services/sales.service";
import { createAdminClient } from "@/lib/supabase/admin";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function SaleDetailPage({ params }: PageProps) {
  const { id } = await params;
  const admin = createAdminClient();
  const { data: sale } = await getSaleById(admin, Number(id));

  if (!sale) {
    notFound();
  }

  const invoice: InvoiceDetail = {
    id: sale.id,
    invoiceNumber: sale.invoice_number,
    status:
      sale.status === "completed"
        ? "Completed"
        : sale.status === "pending"
          ? "Pending"
          : sale.status === "in_progress"
            ? "In Progress"
            : "Cancelled",
    saleType: sale.sale_type,
    paymentStatus: sale.payment_status,
    createdAt: new Date(sale.created_at).toLocaleString("id-ID"),
    transactionType: "sale",
    entityName: sale.customer?.name ?? "Walk-in Customer",
    entityPhone: sale.customer?.phone ?? "-",
    entityVehicle: sale.vehicle
      ? [sale.vehicle.brand, sale.vehicle.model].filter(Boolean).join(" ") || undefined
      : undefined,
    entityPlate: sale.vehicle?.plate_number ?? undefined,
    mechanicName: sale.mechanic?.name ?? "-",
    mechanicStation: "-",
    jobStart: "-",
    jobEnd: "-",
    paymentMethod: sale.payment_method?.name ?? "-",
    paymentMethodIcon: sale.payment_method?.icon ?? null,
    transactionId: sale.invoice_number,
    cashAmount: sale.cash_amount,
    changeAmount: sale.change_amount,
    paidAmount: sale.paid_amount,
    remainingAmount: sale.remaining_amount,
    items: (sale.details ?? []).map((d) => ({
      id: d.id,
      name: d.item?.name ?? "Item",
      description: d.item?.description ?? "",
      type: d.service_fee > 0 ? "Service" : "Part",
      unitPrice: d.base_price,
      qty: d.quantity,
      discount: d.discount_amount,
      subtotal: d.subtotal,
      icon: d.service_fee > 0 ? "wrench" : "package",
    })),
    subtotal: (sale.details ?? []).reduce((sum, d) => sum + d.subtotal, 0),
    totalDiscount: (sale.details ?? []).reduce(
      (sum, d) => sum + d.discount_amount,
      0
    ),
    taxPercent: 0,
    taxAmount: 0,
    grandTotal: sale.total_amount,
    createdBy: sale.created_by,
  };

  return (
    <>
      <Navbar
        title="Detail Penjualan"
        subtitle="Detail invoice penjualan & service"
      />
      <div className="flex-1 overflow-auto p-6">
        <div className="flex justify-end gap-3 pb-4">
          <SalePaymentActions
            saleId={sale.id}
            invoiceNumber={sale.invoice_number}
            totalAmount={sale.total_amount}
            paidAmount={sale.paid_amount ?? 0}
            paymentStatus={sale.payment_status}
          />
        </div>
        <TransactionDetail
          invoice={invoice}
          backHref="/dashboard/transactions/sales"
        />
      </div>
    </>
  );
}
