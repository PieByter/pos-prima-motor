"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/locales";

export function DashboardPrintButton() {
  const { t } = useLocale();
  const handlePrint = () => {
    // Add print class to body for formatting
    document.body.classList.add("printing-dashboard");

    // Wait a tick for the CSS to apply, then print
    setTimeout(() => {
      window.print();
    }, 100);

    // Remove class after print dialog closes
    setTimeout(() => {
      document.body.classList.remove("printing-dashboard");
    }, 1000);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-2 text-xs h-8"
      onClick={handlePrint}
    >
      <Printer className="h-3.5 w-3.5" />
      {t("dashboard.printDashboard")}
    </Button>
  );
}
