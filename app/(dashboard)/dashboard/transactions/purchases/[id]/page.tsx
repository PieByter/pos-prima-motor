import { notFound } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { TransactionDetail } from "@/components/transactions/transaction-detail";
import { dummyPurchaseInvoices } from "@/lib/data/invoice-details";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function PurchaseDetailPage({ params }: PageProps) {
  const { id } = await params;
  const invoice = dummyPurchaseInvoices[Number(id)];

  if (!invoice) {
    notFound();
  }

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
