"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Loader } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";


interface Transaction {
  id: string;
  customer: string;
  amount: number;
  status: "completed" | "processing" | "pending";
}
export function RecentTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await fetch("/api/dashboard/recent");
        if (!response.ok) throw new Error("Failed to fetch");
        const result = await response.json();
        const mapped = (result ?? []).map(
          (row: {
            id: number;
            invoice_number: string;
            total_amount: number;
            status: string;
            customer?: { name?: string };
          }) => ({
            id: row.invoice_number ?? `TRX-${row.id}`,
            customer: row.customer?.name ?? "Walk-in Customer",
            amount: Number(row.total_amount ?? 0),
            status: row.status === "completed" ? "completed" : "processing",
          })
        );
        setTransactions(mapped);
      } catch (error) {
        console.error("Error fetching transactions:", error);
        setTransactions([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
      <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
          Recent Transactions
        </h3>
        <a
          href="#"
          className="text-sm text-sky-500 hover:underline font-medium"
        >
          View All
        </a>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50 dark:bg-gray-800/50">
            <TableHead className="text-xs uppercase">Order ID</TableHead>
            <TableHead className="text-xs uppercase">Customer</TableHead>
            <TableHead className="text-xs uppercase">Amount</TableHead>
            <TableHead className="text-xs uppercase">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-6">
                <Loader className="h-6 w-6 animate-spin text-gray-400 mx-auto" />
              </TableCell>
            </TableRow>
          ) : (
          transactions.map((tx) => (
            <TableRow key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
              <TableCell className="font-medium text-sky-500">
                {tx.id}
              </TableCell>
              <TableCell className="text-gray-900 dark:text-white">
                {tx.customer}
              </TableCell>
              <TableCell className="text-gray-900 dark:text-white">
                {formatCurrency(tx.amount)}
              </TableCell>
              <TableCell>
                {tx.status === "completed" ? (
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 hover:bg-green-100">
                    Completed
                  </Badge>
                ) : (
                  <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 hover:bg-blue-100">
                    Processing
                  </Badge>
                )}
              </TableCell>
            </TableRow>
          ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
