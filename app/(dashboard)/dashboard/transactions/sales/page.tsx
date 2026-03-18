import { Navbar } from "@/components/layout/navbar";
import { TransactionTable } from "@/components/transactions/transaction-table";

export default function SalesPage() {
  return (
    <>
      <Navbar
        title="Penjualan"
        subtitle="Kelola dan lihat semua catatan penjualan."
      />

      <TransactionTable
        type="sale"
        entityLabel="Customer"
        showMechanic
      />
    </>
  );
}
