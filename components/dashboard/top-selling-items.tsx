"use client";

import { useEffect, useState } from "react";
import { Droplets, Settings, Bike, Wrench, Loader } from "lucide-react";


interface TopItem {
  item_id?: number;
  name: string;
  category?: string;
  amount: number;
}
export function TopSellingItems() {
  const [items, setItems] = useState<TopItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTopItems = async () => {
      try {
        const response = await fetch("/api/dashboard/top-items");
        if (!response.ok) throw new Error("Failed to fetch");
        const result = await response.json();
        const mapped = (result ?? []).map(
          (row: { item_id: number; name: string; total_revenue: number }) => ({
            item_id: row.item_id,
            name: row.name,
            category: "Sparepart",
            amount: Number(row.total_revenue ?? 0),
          })
        );
        setItems(mapped);
      } catch (error) {
        console.error("Error fetching top items:", error);
        setItems([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTopItems();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
        Top Selling Items
      </h3>

      <div className="space-y-5">
        {isLoading ? (
          <div className="flex justify-center py-6">
            <Loader className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : (
        items.map((item) => (
          <div key={item.name} className="flex items-center gap-4">
            <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded-lg">
              <Droplets className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {item.name}
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {item.category}
              </p>
            </div>
            <span className="text-sm font-bold text-gray-900 dark:text-white whitespace-nowrap">
              {formatCurrency(item.amount)}
            </span>
          </div>
        ))
        )}
      </div>

      <button className="w-full mt-6 py-2 text-sm text-sky-500 font-medium hover:bg-sky-50 dark:hover:bg-sky-900/20 rounded-lg transition-colors cursor-pointer">
        View All Items
      </button>
    </div>
  );
}
