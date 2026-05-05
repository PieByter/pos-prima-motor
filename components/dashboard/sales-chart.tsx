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
import {
  DashboardCard,
  SectionHeader,
  EmptyState,
  LoadingSpinner,
} from "./ui/dashboard-card";
import { formatCompactCurrency } from "@/lib/format";

export function SalesChart() {
  const [data, setData] = useState<Array<{ day: string; sales: number }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState("7days");

  useEffect(() => {
    const fetchChartData = async () => {
      setIsLoading(true);
      try {
        const end = new Date();
        const start = new Date();

        if (period === "7days") start.setDate(start.getDate() - 7);
        else if (period === "month") start.setMonth(start.getMonth() - 1);
        else if (period === "year") start.setFullYear(start.getFullYear() - 1);

        const response = await fetch(
          `/api/dashboard/chart?start=${start.toISOString().split("T")[0]}&end=${end.toISOString().split("T")[0]}`,
        );
        if (!response.ok) throw new Error("Failed to fetch");
        const result = await response.json();
        const mapped = (result ?? []).map(
          (row: { date: string; amount: number }) => ({
            day: new Date(row.date).toLocaleDateString("id-ID", {
              weekday: "short",
            }),
            sales: Number(row.amount ?? 0),
          }),
        );
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
    <DashboardCard>
      <SectionHeader label="Revenue trend" title="Sales Trends">
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 shadow-sm focus:border-sky-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
        >
          <option value="7days">Last 7 Days</option>
          <option value="month">Last Month</option>
          <option value="year">Last Year</option>
        </select>
      </SectionHeader>

      <div className="h-72 w-full px-3 pb-3 pt-4">
        {isLoading ? (
          <LoadingSpinner />
        ) : data.length === 0 ? (
          <EmptyState message="No sales data for the selected period." />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0EA5E9" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#0EA5E9" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="4 4"
                stroke="#E2E8F0"
                vertical={false}
              />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 11, fill: "#94A3B8" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={formatCompactCurrency}
                tick={{ fontSize: 11, fill: "#94A3B8" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(value) => [
                  `Rp ${Number(value).toLocaleString("id-ID")}`,
                  "Sales",
                ]}
                contentStyle={{
                  backgroundColor: "#0F172A",
                  border: "1px solid #1E293B",
                  borderRadius: "12px",
                  color: "#F8FAFC",
                  fontSize: "12px",
                  padding: "8px 12px",
                }}
                labelStyle={{ color: "#94A3B8" }}
              />
              <Area
                type="monotone"
                dataKey="sales"
                stroke="#0EA5E9"
                strokeWidth={2}
                fill="url(#salesGradient)"
                dot={{
                  r: 3,
                  fill: "#FFFFFF",
                  stroke: "#0EA5E9",
                  strokeWidth: 2,
                }}
                activeDot={{
                  r: 5,
                  fill: "#0EA5E9",
                  stroke: "#FFFFFF",
                  strokeWidth: 2,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </DashboardCard>
  );
}
