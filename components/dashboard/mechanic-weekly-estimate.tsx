"use client";

import { Wallet, TrendingUp, Wrench, Calendar } from "lucide-react";
import { useFetch } from "@/lib/hooks/use-fetch";
import { formatCurrency } from "@/lib/format";

interface MechanicDashboard {
    today: {
        transactionCount: number;
        totalSales: number;
        serviceFees: number;
    };
    week: {
        transactionCount: number;
        totalSales: number;
        serviceFees: number;
        weekStart: string;
    };
    earnings: {
        weeklySalary: number;
        commissionPct: number;
        weekCommission: number;
        estimatedWeekEarnings: number;
    };
    lowStockCount: number;
}

export function MechanicWeeklyEstimate() {
    const { data, isLoading } = useFetch<MechanicDashboard>("/api/dashboard/mechanic");

    if (isLoading) {
        return (
            <div className="animate-pulse rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
                <div className="h-4 w-40 rounded bg-slate-200 dark:bg-slate-700" />
                <div className="mt-4 space-y-3">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex items-center justify-between">
                            <div className="h-4 w-24 rounded bg-slate-100 dark:bg-slate-700" />
                            <div className="h-4 w-20 rounded bg-slate-100 dark:bg-slate-700" />
                        </div>
                    ))}
                    <div className="my-2 border-t border-slate-100 dark:border-slate-700" />
                    <div className="flex items-center justify-between">
                        <div className="h-5 w-16 rounded bg-slate-200 dark:bg-slate-700" />
                        <div className="h-5 w-24 rounded bg-slate-200 dark:bg-slate-700" />
                    </div>
                </div>
            </div>
        );
    }

    const d = data ?? {
        today: { transactionCount: 0, totalSales: 0, serviceFees: 0 },
        week: { transactionCount: 0, totalSales: 0, serviceFees: 0, weekStart: "" },
        earnings: { weeklySalary: 0, commissionPct: 0, weekCommission: 0, estimatedWeekEarnings: 0 },
        lowStockCount: 0,
    };

    const formatWeekRange = (weekStart: string) => {
        if (!weekStart) return "Minggu ini";
        const start = new Date(weekStart);
        const end = new Date(start);
        end.setDate(end.getDate() + 6);
        const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
        return `${start.toLocaleDateString("id-ID", opts)} — ${end.toLocaleDateString("id-ID", opts)}`;
    };

    return (
        <div className="rounded-xl border border-amber-200 bg-linear-to-br from-amber-50 to-white p-6 shadow-sm dark:border-amber-800 dark:from-amber-900/20 dark:to-slate-800">
            <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                    <Wallet className="h-5 w-5" />
                </div>
                <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-white">
                        Estimasi Pendapatan Mingguan
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                        {formatWeekRange(d.week.weekStart)}
                    </p>
                </div>
            </div>

            <div className="mt-5 space-y-3">
                <div className="flex items-center justify-between rounded-lg bg-white/60 px-3 py-2 dark:bg-slate-800/60">
                    <span className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <Calendar className="h-3.5 w-3.5" /> Gaji Pokok
                    </span>
                    <span className="font-mono text-sm font-semibold text-slate-700 dark:text-slate-300">
                        {formatCurrency(d.earnings.weeklySalary)}
                    </span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-white/60 px-3 py-2 dark:bg-slate-800/60">
                    <span className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <Wrench className="h-3.5 w-3.5" /> Total Jasa Minggu Ini
                    </span>
                    <span className="font-mono text-sm font-semibold text-sky-600 dark:text-sky-400">
                        {formatCurrency(d.week.serviceFees)}
                    </span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-white/60 px-3 py-2 dark:bg-slate-800/60">
                    <span className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <TrendingUp className="h-3.5 w-3.5" /> Komisi ({d.earnings.commissionPct}%)
                    </span>
                    <span className="font-mono text-sm font-semibold text-amber-600 dark:text-amber-400">
                        {formatCurrency(d.earnings.weekCommission)}
                    </span>
                </div>

                <div className="border-t border-amber-200 pt-3 dark:border-amber-800">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-800 dark:text-white">
                            Estimasi Total
                        </span>
                        <span className="font-mono text-lg font-extrabold text-amber-700 dark:text-amber-300">
                            {formatCurrency(d.earnings.estimatedWeekEarnings)}
                        </span>
                    </div>
                    <p className="mt-1 text-[10px] text-slate-400 dark:text-slate-500">
                        *Estimasi berdasarkan data transaksi minggu ini. Komisi dihitung dari total jasa × persentase.
                    </p>
                </div>
            </div>
        </div>
    );
}
