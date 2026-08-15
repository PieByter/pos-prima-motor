"use client";

import { useEffect, useState, useCallback } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  DashboardCard,
  SectionHeader,
  EmptyState,
  LoadingSpinner,
} from "./ui/dashboard-card";
import { formatCompactCurrency } from "@/lib/format";
import { TrendingUp, SwitchCamera } from "lucide-react";
import { useLocale } from "@/lib/locales";

type ChartDataPoint = { day: string; sales: number; prevSales?: number };

function getPeriodDates(period: string, compare: boolean) {
  const end = new Date();
  const start = new Date();

  if (period === "7days") start.setDate(start.getDate() - 7);
  else if (period === "month") start.setMonth(start.getMonth() - 1);
  else if (period === "year") start.setFullYear(start.getFullYear() - 1);
  else start.setDate(start.getDate() - 7);

  const prevStart = new Date(start);
  const prevEnd = new Date(start);
  const diff = end.getTime() - start.getTime();
  prevStart.setTime(prevStart.getTime() - diff);
  prevEnd.setTime(prevEnd.getTime() - 1);

  return { start, end, prevStart: compare ? prevStart : null, prevEnd: compare ? prevEnd : null };
}

export function SalesChart({ dateRange }: { dateRange?: { start: string; end: string } }) {
  const { t, locale } = useLocale();
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState<string | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [growth, setGrowth] = useState<number | null>(null);

  const chartStart = dateRange?.start;
  const chartEnd = dateRange?.end;

  const fetchChartData = useCallback(async () => {
    try {
      let start: Date, end: Date, prevStart: Date | null, prevEnd: Date | null;

      if (chartStart && chartEnd) {
        start = new Date(chartStart);
        end = new Date(chartEnd);
        prevStart = null;
        prevEnd = null;
      } else {
        const dates = getPeriodDates(period ?? "7days", compareMode);
        start = dates.start;
        end = dates.end;
        prevStart = dates.prevStart;
        prevEnd = dates.prevEnd;
      }

      const [currentRes, prevRes] = await Promise.all([
        fetch(
          `/api/dashboard/chart?start=${start.toISOString().split("T")[0]}&end=${end.toISOString().split("T")[0]}`,
        ),
        prevStart && prevEnd
          ? fetch(
              `/api/dashboard/chart?start=${prevStart.toISOString().split("T")[0]}&end=${prevEnd.toISOString().split("T")[0]}`,
            )
          : Promise.resolve(null),
      ]);

      if (!currentRes.ok) {
        if (currentRes.status === 500) { setData([]); return; }
        throw new Error("Failed to fetch");
      }

      const currentData = await currentRes.json();
      const mappedCurrent = (currentData ?? []).map(
        (row: { date: string; amount: number }) => ({
          day: new Date(row.date).toLocaleDateString(locale, { weekday: "short" }),
          sales: Number(row.amount ?? 0),
        }),
      );

      // Calculate growth if comparison is active
      if (prevRes && prevRes.ok) {
        const prevData = await prevRes.json();
        const prevSales = (prevData ?? []).reduce(
          (sum: number, r: { amount: number }) => sum + Number(r.amount ?? 0), 0,
        );
        const currentSales = mappedCurrent.reduce(
          (sum: number, r: ChartDataPoint) => sum + r.sales, 0,
        );
        setGrowth(prevSales > 0 ? Math.round(((currentSales - prevSales) / prevSales) * 100) : null);

        // Map previous data to same day indices
        const mappedPrev = (prevData ?? []).map(
          (row: { date: string; amount: number }, i: number) => ({
            day: mappedCurrent[i]?.day ?? new Date(row.date).toLocaleDateString(locale, { weekday: "short" }),
            prevSales: Number(row.amount ?? 0),
          }),
        );

        // Merge
        const merged = mappedCurrent.map((p: ChartDataPoint, i: number) => ({
          ...p,
          prevSales: mappedPrev[i]?.prevSales ?? 0,
        }));
        setData(merged);
      } else {
        setGrowth(null);
        setData(mappedCurrent);
      }
    } catch (error) {
      console.error("Error fetching chart data:", error);
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, [period, chartStart, chartEnd, compareMode, locale]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchChartData();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchChartData]);

  const totalSales = data.reduce((sum, d) => sum + d.sales, 0);

  return (
    <DashboardCard>
      <SectionHeader label={t("dashboard.revenueTrend")} title={t("dashboard.salesTrend")}>
        <div className="flex items-center gap-2">
          {/* Growth badge */}
          {growth !== null && compareMode && (
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
              growth >= 0
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                : "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400"
            }`}>
              <TrendingUp className={`h-3 w-3 ${growth >= 0 ? "" : "rotate-180"}`} />
              {growth >= 0 ? "+" : ""}{growth}%
            </span>
          )}

          {/* Compare toggle */}
          {!dateRange && (
            <button
              onClick={() => setCompareMode(!compareMode)}
              className={`h-9 rounded-lg border px-3 text-xs font-medium transition-colors ${
                compareMode
                  ? "bg-sky-500 text-white border-sky-500"
                  : "bg-white text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
              }`}
              title={t("dashboard.compareTooltip")}
            >
              <SwitchCamera className="h-3.5 w-3.5 inline mr-1" />
              {t("dashboard.compare")}
            </button>
          )}

          {!dateRange && (
            <select
              value={period ?? "7days"}
              onChange={(e) => setPeriod(e.target.value)}
              className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 shadow-sm focus:border-sky-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              <option value="7days">{t("time.last7Days")}</option>
              <option value="month">{t("time.lastMonth")}</option>
              <option value="year">{t("time.lastYear")}</option>
            </select>
          )}

          {/* Total */}
          {!isLoading && data.length > 0 && (
            <span className="hidden md:inline text-xs text-slate-400 font-medium">
              {t("common.total")}: {formatCompactCurrency(totalSales)}
            </span>
          )}
        </div>
      </SectionHeader>

      <div className="h-72 w-full px-3 pb-3 pt-4">
        {isLoading ? (
          <LoadingSpinner />
        ) : data.length === 0 ? (
          <EmptyState message={t("dashboard.noSalesData")} />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0EA5E9" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#0EA5E9" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="prevSalesGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#94A3B8" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#94A3B8" stopOpacity={0} />
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
                formatter={(value, name) => [
                  `Rp ${Number(value).toLocaleString(locale)}`,
                  name === "sales" ? t("dashboard.thisPeriod") : t("dashboard.prevPeriod"),
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
              {compareMode && (
                <Area
                  type="monotone"
                  dataKey="prevSales"
                  stroke="#94A3B8"
                  strokeWidth={1.5}
                  strokeDasharray="5 5"
                  fill="url(#prevSalesGradient)"
                  dot={false}
                  activeDot={{ r: 4, fill: "#94A3B8" }}
                />
              )}
              <Area
                type="monotone"
                dataKey="sales"
                stroke="#0EA5E9"
                strokeWidth={2}
                fill="url(#salesGradient)"
                dot={{ r: 3, fill: "#FFFFFF", stroke: "#0EA5E9", strokeWidth: 2 }}
                activeDot={{ r: 5, fill: "#0EA5E9", stroke: "#FFFFFF", strokeWidth: 2 }}
              />
              {compareMode && (
                <Legend
                  formatter={(value: string) =>
                    value === "sales" ? t("dashboard.thisPeriod") : t("dashboard.prevPeriod")
                  }
                  wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </DashboardCard>
  );
}
