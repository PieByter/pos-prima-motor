"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { useFetch } from "@/lib/hooks/use-fetch";
import { formatCurrency } from "@/lib/format";
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

interface TransactionRaw {
  id: number;
  invoice_number: string;
  total_amount: number;
  status: string;
  customer?: { name?: string };
}

interface Transaction {
  id: string;
  customer: string;
  amount: number;
  status: "completed" | "processing";
}

export function RecentTransactions() {
  const { t } = useLocale();
  const { data: rawData, isLoading } = useFetch<TransactionRaw[]>(
    "/api/dashboard/recent",
  );

  const transactions: Transaction[] = (rawData ?? []).map((row) => ({
    id: row.invoice_number ?? `TRX-${row.id}`,
    customer: row.customer?.name ?? t("dashboard.walkInCustomer"),
    amount: Number(row.total_amount ?? 0),
    status: row.status === "completed" ? "completed" : "processing",
  }));

  return (
    <DashboardCard>
      <SectionHeader label={t("dashboard.latestActivity")} title={t("dashboard.recentTransactions")}>
        <Link
          href="/dashboard/transactions/sales"
          className="text-xs font-semibold text-sky-600 transition-colors hover:text-sky-500 dark:text-sky-400"
        >
          {t("common.seeAll")}
        </Link>
      </SectionHeader>

      <div className="px-2 pb-2">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/60 dark:bg-slate-900/30">
              <TableHead className="text-[10px] font-bold uppercase tracking-[0.15em]">
                {t("dashboard.orderId")}
              </TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-[0.15em]">
                {t("masterData.customer")}
              </TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-[0.15em]">
                {t("dashboard.amount")}
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
            ) : transactions.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="py-8 text-center text-sm text-slate-400"
                >
                  {t("dashboard.noRecentTransactions")}
                </TableCell>
              </TableRow>
            ) : (
              transactions.map((tx) => (
                <TableRow
                  key={tx.id}
                  className="transition-colors hover:bg-slate-50/60 dark:hover:bg-slate-800/30"
                >
                  <TableCell className="font-mono text-xs font-semibold text-sky-600 dark:text-sky-400">
                    {tx.id}
                  </TableCell>
                  <TableCell className="text-slate-700 dark:text-slate-200">
                    {tx.customer}
                  </TableCell>
                  <TableCell className="font-semibold text-slate-700 dark:text-slate-200">
                    {formatCurrency(tx.amount)}
                  </TableCell>
                  <TableCell>
                    {tx.status === "completed" ? (
                      <Badge className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 hover:bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-300">
                        {t("dashboard.statusCompleted")}
                      </Badge>
                    ) : (
                      <Badge className="rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-sky-700 hover:bg-sky-50 dark:bg-sky-900/20 dark:text-sky-300">
                        {t("dashboard.statusProcessing")}
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
