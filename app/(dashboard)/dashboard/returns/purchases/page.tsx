import { Navbar } from "@/components/layout/navbar";
import { ReturnsPage } from "@/components/transactions/returns-page";

export default function PurchaseReturnsPage() {
  return (
    <>
      <Navbar title="Retur Pembelian" subtitle="Kelola retur barang ke supplier." />
      <ReturnsPage type="purchases" />
    </>
  );
}
