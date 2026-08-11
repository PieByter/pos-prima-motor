import { WarrantyClaimsPage } from "@/components/warranty/warranty-claims";

export const metadata = {
  title: "Klaim Garansi - Prima Motor POS",
};

export default function WarrantyClaimsRoute() {
  return (
    <div className="space-y-6">
      <WarrantyClaimsPage />
    </div>
  );
}
