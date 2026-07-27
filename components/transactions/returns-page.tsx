"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";

type ReturnItem = {
  id: number;
  return_date: string;
  reason: string;
  total_refund: number;
  status: string;
  created_at: string;
};

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  processed: "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  rejected: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  processed: "Diproses",
  rejected: "Ditolak",
};

export function ReturnsPage({ type }: { type: "sales" | "purchases" }) {
  const [items, setItems] = useState<ReturnItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const apiPath = type === "sales" ? "/api/returns/sales" : "/api/returns/purchases";

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(apiPath);
        if (res.ok) setItems(await res.json());
      } catch { /* empty */ } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [apiPath]);

  return (
    <div className="rounded-xl border bg-white dark:bg-slate-800">
      {isLoading ? (
        <div className="space-y-3 p-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : items.length === 0 ? (
        <p className="p-6 text-center text-sm text-slate-400">
          Belum ada retur {type === "sales" ? "penjualan" : "pembelian"}.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-slate-50 dark:bg-slate-900/50">
              <tr className="text-left text-xs text-slate-500">
                <th className="px-4 py-3">Tanggal</th>
                <th className="px-4 py-3">Alasan</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Refund</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                  <td className="px-4 py-3">{item.return_date}</td>
                  <td className="px-4 py-3">{item.reason}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[item.status] || ""}`}>
                      {STATUS_LABELS[item.status] || item.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium">{formatCurrency(Number(item.total_refund))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
