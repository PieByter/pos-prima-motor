import { Navbar } from "@/components/layout/navbar";
import { ItemsTable } from "@/components/master-data/items-table";

export default function MasterDataPage() {
  return (
    <>
      <Navbar
        title="Master Data"
        subtitle="Manage spareparts, categories, and inventory items."
      />

      <ItemsTable />
    </>
  );
}
