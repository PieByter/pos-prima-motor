import { notFound } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { TransactionDetail } from "@/components/transactions/transaction-detail";
import { SalePaymentActions } from "@/components/transactions/sale-payment-actions";
import { mapSaleToInvoice } from "@/lib/data/invoice-details";
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

  const invoice = mapSaleToInvoice(sale);

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
