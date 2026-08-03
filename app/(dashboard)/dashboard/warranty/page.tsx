import { Navbar } from "@/components/layout/navbar";
import { WarrantyTable } from "@/components/reports/warranty-table";

export const metadata = {
  title: "Garansi - Prima Motor POS",
};

export default function WarrantyPage() {
  return (
    <div className="space-y-6">
      <Navbar
        title="Garansi"
        subtitle="Daftar garansi barang terjual — aktif, hampir habis, dan kadaluarsa."
      />
      <WarrantyTable />
    </div>
  );
}
