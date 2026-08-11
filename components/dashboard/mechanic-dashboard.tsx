"use client";

import { useCallback, useEffect, useState } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Loader2, Wrench, ShoppingCart, Coins, TrendingUp, AlertTriangle, CheckCircle2, Play } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { useUserRole } from "@/lib/hooks/use-user-role";
import { useToast } from "@/lib/toast-provider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type MechanicStats = {
  today: { transactionCount: number; totalSales: number; serviceFees: number };
  week: { transactionCount: number; totalSales: number; serviceFees: number; weekStart: string };
  earnings: { weeklySalary: number; commissionPct: number; weekCommission: number; estimatedWeekEarnings: number };
  lowStockCount: number;
};

type AppointmentRow = {
  id: number;
  status: "waiting" | "in_progress" | "done" | "cancelled";
  customer?: { name: string; phone: string | null } | null;
  vehicle?: { plate_number: string; brand: string | null; model: string | null } | null;
  description?: string | null;
};

/** Dashboard khusus mekanik — antrian + pendapatan pribadi. */
export function MechanicDashboard() {
  const { showToast } = useToast();
  const { userRole, loading: roleLoading } = useUserRole();
  const [stats, setStats] = useState<MechanicStats | null>(null);
  const [queue, setQueue] = useState<AppointmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const isAdmin = userRole?.role === "admin";

  const loadAll = useCallback(async () => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const [statsRes, queueRes] = await Promise.all([
        fetch("/api/dashboard/mechanic", { cache: "no-store" }),
        fetch(`/api/appointments?date=${today}`, { cache: "no-store" }),
      ]);
      if (statsRes.ok) setStats(await statsRes.json());
      if (queueRes.ok) {
        const list = await queueRes.json();
        setQueue(Array.isArray(list) ? list : []);
      }
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => {
      void loadAll();
    }, 0);
    return () => window.clearTimeout(t);
  }, [loadAll]);

  const activeQueue = queue.filter((q) => q.status === "waiting" || q.status === "in_progress");

  async function handleQueueStatus(id: number, status: "in_progress" | "done") {
    try {
      const res = await fetch(`/api/appointments?id=${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Gagal");
      showToast(status === "in_progress" ? "Antrian diambil" : "Antrian selesai", "success");
      await loadAll();
    } catch {
      showToast("Gagal update", "error");
    }
  }

  if (loading || roleLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
      </div>
    );
  }

  // Admin lihat halaman ini sebagai preview (dengan catatan)
  return (
    <>
      <Navbar
        title={isAdmin ? "Dashboard Mekanik (Preview)" : "Dashboard Mekanik"}
        subtitle="Antrian service & pendapatan Anda hari ini."
      />
      {isAdmin && (
        <p className="text-xs text-slate-400 bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800 rounded-lg px-3 py-2">
          Anda login sebagai admin — data di bawah adalah antrian umum. Mekanik yang login hanya melihat antrian & komisi mereka.
        </p>
      )}

      <div className="space-y-6">
        {/* Kartu statistik */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border bg-white dark:bg-slate-800 p-5">
            <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400">
              <Wrench className="h-4 w-4" />
              <p className="text-xs font-medium">Transaksi Hari Ini</p>
            </div>
            <p className="mt-2 text-2xl font-bold">{stats?.today.transactionCount ?? 0}</p>
          </div>
          <div className="rounded-xl border bg-white dark:bg-slate-800 p-5">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <ShoppingCart className="h-4 w-4" />
              <p className="text-xs font-medium">Penjualan Hari Ini</p>
            </div>
            <p className="mt-2 text-2xl font-bold">{formatCurrency(stats?.today.totalSales ?? 0)}</p>
          </div>
          <div className="rounded-xl border bg-white dark:bg-slate-800 p-5">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <Coins className="h-4 w-4" />
              <p className="text-xs font-medium">Jasa Service Hari Ini</p>
            </div>
            <p className="mt-2 text-2xl font-bold">{formatCurrency(stats?.today.serviceFees ?? 0)}</p>
          </div>
          <div className="rounded-xl border bg-white dark:bg-slate-800 p-5">
            <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400">
              <TrendingUp className="h-4 w-4" />
              <p className="text-xs font-medium">Estimasi Gaji Minggu Ini</p>
            </div>
            <p className="mt-2 text-2xl font-bold">{formatCurrency(stats?.earnings.estimatedWeekEarnings ?? 0)}</p>
            <p className="mt-1 text-xs text-slate-400">
              Gaji {formatCurrency(stats?.earnings.weeklySalary ?? 0)} + Komisi {stats?.earnings.commissionPct ?? 0}% ({formatCurrency(stats?.earnings.weekCommission ?? 0)})
            </p>
          </div>
        </div>

        {/* Antrian hari ini */}
        <div className="rounded-xl border bg-white dark:bg-slate-800 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <Wrench className="h-4 w-4 text-sky-500" />
              <h3 className="font-semibold">Antrian Hari Ini ({activeQueue.length})</h3>
            </div>
            {stats && stats.lowStockCount > 0 && (
              <Badge variant="secondary" className="gap-1 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400">
                <AlertTriangle className="h-3 w-3" /> {stats.lowStockCount} stok menipis
              </Badge>
            )}
          </div>

          {activeQueue.length === 0 ? (
            <p className="p-8 text-center text-sm text-slate-400">Tidak ada antrian aktif. 🎉</p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {activeQueue.map((q) => (
                <div key={q.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <p className="font-medium truncate">
                      {q.customer?.name ?? "Walk-in"}
                      {q.vehicle && <span className="ml-2 font-mono text-xs text-slate-400">{q.vehicle.plate_number}</span>}
                    </p>
                    <p className="text-xs text-slate-400 truncate">
                      {q.vehicle ? `${[q.vehicle.brand, q.vehicle.model].filter(Boolean).join(" ")} · ` : ""}
                      {q.description ?? "—"}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge
                      variant="secondary"
                      className={q.status === "in_progress"
                        ? "bg-sky-50 text-sky-700 dark:bg-sky-900/20 dark:text-sky-400"
                        : "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400"}
                    >
                      {q.status === "in_progress" ? "Dikerjakan" : "Menunggu"}
                    </Badge>
                    {q.status === "waiting" && (
                      <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-sky-600" onClick={() => handleQueueStatus(q.id, "in_progress")}>
                        <Play className="h-3 w-3" /> Ambil
                      </Button>
                    )}
                    {q.status === "in_progress" && (
                      <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-emerald-600" onClick={() => handleQueueStatus(q.id, "done")}>
                        <CheckCircle2 className="h-3 w-3" /> Selesai
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
