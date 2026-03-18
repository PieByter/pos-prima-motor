"use client";

import { useEffect, useState } from "react";
import {
  DollarSign,
  ShoppingBag,
  Package,
  Users,
  TrendingUp,
  TrendingDown,
  Plus,
  Loader,
} from "lucide-react";

interface SummaryData {
  totalSales: number;
  totalPurchases: number;
  totalItems: number;
  totalCustomers: number;
}

export function SummaryCards() {
  const [data, setData] = useState<SummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const response = await fetch("/api/dashboard/summary");
        if (!response.ok) throw new Error("Failed to fetch");
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error("Error fetching summary:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSummary();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat("id-ID").format(value);
  };

  const stats = [
  {
    label: "Total Sales",
     value: data ? formatCurrency(data.totalSales) : "—",
    change: "12.5%",
    trend: "up" as const,
    sub: "vs last month",
    icon: DollarSign,
    iconBg: "bg-blue-50 dark:bg-blue-900/20",
    iconColor: "text-blue-600 dark:text-blue-400",
  },
  {
    label: "Total Purchases",
     value: data ? formatCurrency(data.totalPurchases) : "—",
    change: "2.3%",
    trend: "down" as const,
    sub: "vs last month",
    icon: ShoppingBag,
    iconBg: "bg-orange-50 dark:bg-orange-900/20",
    iconColor: "text-orange-600 dark:text-orange-400",
  },
  {
    label: "Inventory Items",
     value: data ? formatNumber(data.totalItems) : "—",
    change: "84",
    trend: "add" as const,
    sub: "new items added",
    icon: Package,
    iconBg: "bg-purple-50 dark:bg-purple-900/20",
    iconColor: "text-purple-600 dark:text-purple-400",
  },
  {
    label: "Active Customers",
     value: data ? formatNumber(data.totalCustomers) : "—",
    change: "5.4%",
    trend: "up" as const,
    sub: "vs last month",
    icon: Users,
    iconBg: "bg-teal-50 dark:bg-teal-900/20",
    iconColor: "text-teal-600 dark:text-teal-400",
  },
    ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                {stat.label}
              </p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {isLoading ? (
                  <Loader className="h-6 w-6 animate-spin text-gray-400" />
                ) : (
                  stat.value
                )}
              </h3>
            </div>
            <div className={`p-2 rounded-lg ${stat.iconBg}`}>
              <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
            </div>
          </div>

          <div className="mt-4 flex items-center text-sm">
            <span
              className={`flex items-center font-medium ${
                stat.trend === "down"
                  ? "text-red-500"
                  : "text-emerald-500"
              }`}
            >
              {stat.trend === "up" && <TrendingUp className="h-4 w-4 mr-0.5" />}
              {stat.trend === "down" && <TrendingDown className="h-4 w-4 mr-0.5" />}
              {stat.trend === "add" && <Plus className="h-4 w-4 mr-0.5" />}
              {stat.change}
            </span>
            <span className="text-gray-400 ml-2">{stat.sub}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
