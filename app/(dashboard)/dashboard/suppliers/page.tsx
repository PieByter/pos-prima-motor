import { Navbar } from "@/components/layout/navbar";
import { SuppliersTable } from "@/components/suppliers/suppliers-table";

export const metadata = {
  title: "Suppliers - Prima Motor POS",
};

export default function SuppliersPage() {
  return (
    <div className="space-y-6">
      <Navbar
        title="Suppliers"
        subtitle="Kelola data pemasok dan kontak utama."
      />
      <SuppliersTable />
    </div>
  );
}
