import { Navbar } from "@/components/layout/navbar";
import { ReturnsPage } from "@/components/transactions/returns-page";

export default function SalesReturnsPage() {
  return (
    <>
      <Navbar title="Retur Penjualan" subtitle="Kelola retur barang dari pelanggan." />
      <ReturnsPage type="sales" />
    </>
  );
}
