import { Navbar } from "@/components/layout/navbar";
import { TransactionTable } from "@/components/transactions/transaction-table";

export default function PurchasesPage() {
  return (
    <div className="space-y-6">
      <Navbar
        title="Pembelian"
        subtitle="Kelola dan lihat semua catatan pembelian dari supplier."
      />

      <TransactionTable
        type="purchase"
        entityLabel="Supplier"
        showMechanic={false}
      />
    </div>
  );
}
