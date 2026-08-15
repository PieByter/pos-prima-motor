"use client";

import { Badge } from "@/components/ui/badge";
import { useFetch } from "@/lib/hooks/use-fetch";
import { useLocale } from "@/lib/locales";
import {
  DashboardCard,
  SectionHeader,
  LoadingSpinner,
} from "./ui/dashboard-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface LowStockRaw {
  name: string;
  current_stock: number;
  category?: string;
}

interface LowStockItem {
  name: string;
  category: string;
  stock: number;
  status: "critical" | "warning";
}

export function LowStockAlert() {
  const { t } = useLocale();
  const { data: rawItems, isLoading } = useFetch<LowStockRaw[]>(
    "/api/dashboard/low-stock",
  );

  const items: LowStockItem[] = (rawItems ?? []).map((row) => ({
    name: row.name,
    category: row.category ?? "Sparepart",
    stock: Number(row.current_stock ?? 0),
    status: Number(row.current_stock ?? 0) <= 3 ? "critical" : "warning",
  }));

  return (
    <DashboardCard>
      <SectionHeader label={t("dashboard.inventoryHealth")} title={t("inventory.lowStockAlert")}>
        <Badge
          variant="destructive"
          className="rounded-full px-2.5 py-0.5 text-[10px] font-bold"
        >
          {t("dashboard.stockCritical")}
        </Badge>
      </SectionHeader>

      <div className="px-2 pb-2">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/60 dark:bg-slate-900/30">
              <TableHead className="text-[10px] font-bold uppercase tracking-[0.15em]">
                {t("inventory.item")}
              </TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-[0.15em]">
                {t("inventory.category")}
              </TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-[0.15em]">
                {t("inventory.stock")}
              </TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-[0.15em]">
                {t("common.status")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4}>
                  <LoadingSpinner />
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="py-8 text-center text-sm text-slate-400"
                >
                  {t("inventory.noLowStock")}
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow
                  key={item.name}
                  className="transition-colors hover:bg-slate-50/60 dark:hover:bg-slate-800/30"
                >
                  <TableCell className="font-medium text-slate-700 dark:text-slate-200">
                    {item.name}
                  </TableCell>
                  <TableCell className="text-slate-500 dark:text-slate-400">
                    {item.category}
                  </TableCell>
                  <TableCell className="font-semibold text-slate-700 dark:text-slate-200">
                    {item.stock}
                  </TableCell>
                  <TableCell>
                    {item.status === "critical" ? (
                      <Badge className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700 hover:bg-rose-50 dark:bg-rose-900/20 dark:text-rose-300">
                        {t("dashboard.stockCritical")}
                      </Badge>
                    ) : (
                      <Badge className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 hover:bg-amber-50 dark:bg-amber-900/20 dark:text-amber-300">
                        {t("dashboard.stockLow")}
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </DashboardCard>
  );
}
