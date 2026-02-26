import { Navbar } from "@/components/layout/navbar";
import { TransactionForm } from "@/components/transactions/transaction-form";

export default function CreateSalePage() {
  return (
    <>
      <Navbar
        title="Buat Penjualan Baru"
        subtitle="Catat penjualan sparepart & jasa service."
      />
      <TransactionForm type="sale" />
    </>
  );
}
