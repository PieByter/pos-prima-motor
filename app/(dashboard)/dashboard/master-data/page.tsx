import { Navbar } from "@/components/layout/navbar";
import { ItemsTable } from "@/components/master-data/items-table";

export const metadata = {
  title: "Master Data – Prima Motor POS",
};

export default function MasterDataPage() {
  return (
    <div className="space-y-6">
      <Navbar
        title="Master Data"
        subtitle="Kelola sparepart, kategori, dan item inventaris."
      />

      <ItemsTable />
    </div>
  );
}
