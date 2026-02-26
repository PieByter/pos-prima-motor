import { Navbar } from "@/components/layout/navbar";
import { TransactionTable } from "@/components/transactions/transaction-table";
import { dummySales } from "@/lib/data/transactions";

export default function SalesPage() {
  return (
    <>
      <Navbar
        title="Penjualan"
        subtitle="Kelola dan lihat semua catatan penjualan."
      />

      <TransactionTable
        type="sale"
        data={dummySales}
        entityLabel="Customer"
        showMechanic
      />
    </>
  );
}
