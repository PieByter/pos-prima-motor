"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/layout/navbar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { History, User, Plus, Pencil, Trash2 } from "lucide-react";

type LogItem = {
  id: number;
  user_id: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  description: string | null;
  created_at: string;
  profiles?: { name: string } | null;
};

const ACTION_STYLES: Record<string, string> = {
  create: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  update: "bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
  delete: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const ACTION_ICONS: Record<string, React.ElementType> = {
  create: Plus,
  update: Pencil,
  delete: Trash2,
};

const ENTITY_LABELS: Record<string, string> = {
  items: "Barang",
  customers: "Customer",
  suppliers: "Supplier",
  sales: "Penjualan",
  purchases: "Pembelian",
  discounts: "Diskon",
  expenses: "Pengeluaran",
  users: "User",
};

export default function ActivityLogPage() {
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [entityFilter, setEntityFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");

  useEffect(() => {
    const fetchLogs = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({ limit: "100" });
        if (entityFilter !== "all") params.append("entity", entityFilter);
        if (actionFilter !== "all") params.append("action", actionFilter);

        const res = await fetch(`/api/activity-log?${params}`);
        if (res.ok) {
          const json = await res.json();
          setLogs(json?.data ?? []);
        }
      } catch { /* ignore */ } finally {
        setIsLoading(false);
      }
    };
    fetchLogs();
  }, [entityFilter, actionFilter]);

  return (
    <>
      <Navbar title="Activity Log" subtitle="Riwayat aktivitas pengguna." />
      <div className="space-y-4">
        {/* Filters */}
        <div className="flex gap-3">
          <Select value={entityFilter} onValueChange={setEntityFilter}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Semua Entity" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Entity</SelectItem>
              {Object.entries(ENTITY_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Semua Aksi" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Aksi</SelectItem>
              <SelectItem value="create">Create</SelectItem>
              <SelectItem value="update">Update</SelectItem>
              <SelectItem value="delete">Delete</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* List */}
        <div className="rounded-xl border bg-white dark:bg-slate-800">
          {isLoading ? (
            <div className="space-y-3 p-4"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-slate-400">
              <History className="h-10 w-10 mb-2 opacity-50" />
              <p className="text-sm">Belum ada aktivitas</p>
            </div>
          ) : (
            <div className="divide-y">
              {logs.map((log) => {
                const Icon = ACTION_ICONS[log.action] ?? History;
                const userName = (log as any).profiles?.name ?? "Sistem";
                return (
                  <div key={log.id} className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/30">
                    <div className={`p-1.5 rounded-lg shrink-0 ${ACTION_STYLES[log.action] || "bg-slate-100"}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-900 dark:text-white">
                        <span className="font-medium">{userName}</span>
                        {log.action === "create" ? " membuat " : log.action === "update" ? " mengubah " : " menghapus "}
                        <span className="font-medium">{ENTITY_LABELS[log.entity] || log.entity}</span>
                        {log.description && <span className="text-slate-500"> — {log.description}</span>}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {new Date(log.created_at).toLocaleString("id-ID")}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
