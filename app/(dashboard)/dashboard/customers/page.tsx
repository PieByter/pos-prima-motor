import { Navbar } from "@/components/layout/navbar";
import { CustomersTable } from "@/components/customers/customers-table";

export const metadata = {
  title: "Customers - Prima Motor POS",
};

export default function CustomersPage() {
  return (
    <div className="space-y-6">
      <Navbar
        title="Customers"
        subtitle="Kelola data pelanggan dan riwayat kontak."
      />
      <CustomersTable />
    </div>
  );
}
