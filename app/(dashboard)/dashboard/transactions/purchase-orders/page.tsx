import { Navbar } from "@/components/layout/navbar";
import { PurchaseOrdersPage } from "@/components/purchase-orders/purchase-orders";

export const metadata = {
  title: "Purchase Order - Prima Motor POS",
};

export default function PurchaseOrdersRoute() {
  return (
    <PurchaseOrdersPage />
  );
}
