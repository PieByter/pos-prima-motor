"use client";

import { ShoppingCart, DollarSign, Wrench, TrendingUp } from "lucide-react";
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

export function MechanicStatsCards() {
    const { data, isLoading } = useFetch<MechanicDashboard>("/api/dashboard/mechanic");

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="animate-pulse rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
                        <div className="h-3 w-20 rounded bg-slate-200 dark:bg-slate-700" />
                        <div className="mt-3 h-7 w-28 rounded bg-slate-200 dark:bg-slate-700" />
                        <div className="mt-2 h-3 w-16 rounded bg-slate-100 dark:bg-slate-700" />
                    </div>
                ))}
            </div>
        );
    }

    const d = data ?? {
        today: { transactionCount: 0, totalSales: 0, serviceFees: 0 },
        week: { transactionCount: 0, totalSales: 0, serviceFees: 0, weekStart: "" },
        earnings: { weeklySalary: 0, commissionPct: 0, weekCommission: 0, estimatedWeekEarnings: 0 },
        lowStockCount: 0,
    };

    const cards = [
        {
            label: "Transaksi Hari Ini",
            value: `${d.today.transactionCount}`,
            sub: "Jumlah transaksi selesai",
            icon: ShoppingCart,
            iconBg: "bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400",
        },
        {
            label: "Omset Hari Ini",
            value: formatCurrency(d.today.totalSales),
            sub: `Jasa: ${formatCurrency(d.today.serviceFees)}`,
            icon: DollarSign,
            iconBg: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
        },
        {
            label: "Transaksi Minggu Ini",
            value: `${d.week.transactionCount}`,
            sub: `Omset: ${formatCurrency(d.week.totalSales)}`,
            icon: TrendingUp,
            iconBg: "bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400",
        },
        {
            label: "Estimasi Gaji Minggu Ini",
            value: formatCurrency(d.earnings.estimatedWeekEarnings),
            sub: `Jasa: ${formatCurrency(d.week.serviceFees)} × ${d.earnings.commissionPct}%`,
            icon: Wrench,
            iconBg: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
        },
    ];

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map((card) => (
                <div
                    key={card.label}
                    className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-slate-700 dark:bg-slate-800"
                >
                    <div className="flex items-center justify-between">
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">
                            {card.label}
                        </p>
                        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${card.iconBg}`}>
                            <card.icon className="h-4 w-4" />
                        </div>
                    </div>
                    <p className="mt-2 text-xl font-bold tracking-tight text-slate-800 dark:text-white">
                        {card.value}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                        {card.sub}
                    </p>
                </div>
            ))}
        </div>
    );
}
