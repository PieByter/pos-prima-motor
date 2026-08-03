import { Navbar } from "@/components/layout/navbar";
import { ReceivablesTable } from "@/components/reports/receivables-table";

export const metadata = {
  title: "Piutang - Prima Motor POS",
};

export default function ReceivablesPage() {
  return (
    <div className="space-y-6">
      <Navbar
        title="Laporan Piutang"
        subtitle="Daftar transaksi belum lunas beserta umur utang untuk ditagih."
      />
      <ReceivablesTable />
    </div>
  );
}
