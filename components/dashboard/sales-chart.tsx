"use client";

import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Loader } from "lucide-react";


const formatCurrency = (value: number) => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
  return value.toString();
};

export function SalesChart() {
  const [data, setData] = useState<Array<{ day: string; sales: number }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState("7days");

  useEffect(() => {
    const fetchChartData = async () => {
      setIsLoading(true);
      try {
        // Calculate date range
        const end = new Date();
        const start = new Date();
        
        if (period === "7days") start.setDate(start.getDate() - 7);
        else if (period === "month") start.setMonth(start.getMonth() - 1);
        else if (period === "year") start.setFullYear(start.getFullYear() - 1);
        
        const response = await fetch(
          `/api/dashboard/chart?start=${start.toISOString().split("T")[0]}&end=${end.toISOString().split("T")[0]}`
        );
        if (!response.ok) throw new Error("Failed to fetch");
        const result = await response.json();
        const mapped = (result ?? []).map((row: { date: string; amount: number }) => ({
          day: new Date(row.date).toLocaleDateString("id-ID", { weekday: "short" }),
          sales: Number(row.amount ?? 0),
        }));
        setData(mapped);
      } catch (error) {
        console.error("Error fetching chart data:", error);
        setData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChartData();
  }, [period]);

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
          Sales Trends
        </h3>
        <select 
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm rounded-lg px-3 py-2 focus:ring-sky-500 focus:border-sky-500">
          <option value="7days">Last 7 Days</option>
          <option value="month">Last Month</option>
          <option value="year">Last Year</option>
        </select>
      </div>

      <div className="h-72 w-full">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0EA5E9" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#0EA5E9" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="5 5" stroke="#E5E7EB" vertical={false} />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 12, fill: "#6B7280" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={formatCurrency}
              tick={{ fontSize: 12, fill: "#6B7280" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              formatter={(value) => [
                `Rp ${Number(value).toLocaleString("id-ID")}`,
                "Sales",
              ]}
              contentStyle={{
                backgroundColor: "#1E293B",
                border: "1px solid #334155",
                borderRadius: "8px",
                color: "#F8FAFC",
                fontSize: "13px",
              }}
              labelStyle={{ color: "#94A3B8" }}
            />
            <Area
              type="monotone"
              dataKey="sales"
              stroke="#0EA5E9"
              strokeWidth={2}
              fill="url(#salesGradient)"
              dot={{ r: 4, fill: "#FFFFFF", stroke: "#0EA5E9", strokeWidth: 2 }}
              activeDot={{ r: 6, fill: "#0EA5E9", stroke: "#FFFFFF", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
