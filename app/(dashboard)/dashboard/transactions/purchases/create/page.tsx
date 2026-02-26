import { Navbar } from "@/components/layout/navbar";
import { TransactionForm } from "@/components/transactions/transaction-form";

export default function CreatePurchasePage() {
  return (
    <>
      <Navbar
        title="Buat Pembelian Baru"
        subtitle="Catat pembelian barang dari supplier."
      />
      <TransactionForm type="purchase" />
    </>
  );
}
