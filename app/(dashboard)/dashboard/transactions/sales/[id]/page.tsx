import { notFound } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { TransactionDetail } from "@/components/transactions/transaction-detail";
import { dummySaleInvoices } from "@/lib/data/invoice-details";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function SaleDetailPage({ params }: PageProps) {
  const { id } = await params;
  const invoice = dummySaleInvoices[Number(id)];

  if (!invoice) {
    notFound();
  }

  return (
    <>
      <Navbar
        title="Detail Penjualan"
        subtitle="Detail invoice penjualan & service"
      />
      <div className="flex-1 overflow-auto p-6">
        <TransactionDetail
          invoice={invoice}
          backHref="/dashboard/transactions/sales"
        />
      </div>
    </>
  );
}
