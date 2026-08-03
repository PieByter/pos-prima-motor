import { Navbar } from "@/components/layout/navbar";
import { PayablesTable } from "@/components/reports/payables-table";

export const metadata = {
  title: "Hutang Supplier - Prima Motor POS",
};

export default function PayablesPage() {
  return (
    <div className="space-y-6">
      <Navbar
        title="Laporan Hutang Supplier"
        subtitle="Daftar pembelian yang belum dibayar ke supplier beserta umur hutang."
      />
      <PayablesTable />
    </div>
  );
}
