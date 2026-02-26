"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const data = [
  { day: "Mon", sales: 1200000 },
  { day: "Tue", sales: 1900000 },
  { day: "Wed", sales: 1500000 },
  { day: "Thu", sales: 2200000 },
  { day: "Fri", sales: 1800000 },
  { day: "Sat", sales: 2800000 },
  { day: "Sun", sales: 2400000 },
];

const formatCurrency = (value: number) => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
  return value.toString();
};

export function SalesChart() {
  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
          Sales Trends
        </h3>
        <select className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm rounded-lg px-3 py-2 focus:ring-sky-500 focus:border-sky-500">
          <option>Last 7 Days</option>
          <option>Last Month</option>
          <option>Last Year</option>
        </select>
      </div>

      <div className="h-72 w-full">
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
      </div>
    </div>
  );
}
