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


interface LowStockItem {
  name: string;
  category: string;
  stock: number;
  status: "critical" | "warning";
}
export function LowStockAlert() {
  const [items, setItems] = useState<LowStockItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLowStock = async () => {
      try {
        const response = await fetch("/api/dashboard/low-stock");
        if (!response.ok) throw new Error("Failed to fetch");
        const result = await response.json();
        const mapped = (result ?? []).map(
          (row: { name: string; current_stock: number; category?: string }) => ({
            name: row.name,
            category: row.category ?? "Sparepart",
            stock: Number(row.current_stock ?? 0),
            status: Number(row.current_stock ?? 0) <= 3 ? "critical" : "warning",
          })
        );
        setItems(mapped);
      } catch (error) {
        console.error("Error fetching low stock items:", error);
        setItems([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLowStock();
  }, []);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
      <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
          Low Stock Alert
        </h3>
        <Badge variant="destructive" className="text-xs font-bold">
          Critical
        </Badge>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50 dark:bg-gray-800/50">
            <TableHead className="text-xs uppercase">Item Name</TableHead>
            <TableHead className="text-xs uppercase">Category</TableHead>
            <TableHead className="text-xs uppercase">Stock</TableHead>
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
          items.map((item) => (
            <TableRow key={item.name} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
              <TableCell className="font-medium text-gray-900 dark:text-white">
                {item.name}
              </TableCell>
              <TableCell className="text-gray-500 dark:text-gray-400">
                {item.category}
              </TableCell>
              <TableCell className="text-gray-900 dark:text-white">
                {item.stock}
              </TableCell>
              <TableCell>
                {item.status === "critical" ? (
                  <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 hover:bg-red-100">
                    Critical
                  </Badge>
                ) : (
                  <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 hover:bg-yellow-100">
                    Warning
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
