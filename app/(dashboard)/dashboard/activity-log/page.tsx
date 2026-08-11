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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { History, User, Plus, Pencil, Trash2, Calendar, Hash, Info } from "lucide-react";

type LogItem = {
  id: number;
  user_id: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  description: string | null;
  created_at: string;
  metadata?: Record<string, unknown> | null;
  profiles?: { name: string } | null;
};

const ACTION_STYLES: Record<string, string> = {
  create: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  update: "bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
  delete: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const ACTION_LABELS: Record<string, string> = {
  create: "Membuat",
  update: "Mengubah",
  delete: "Menghapus",
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
  const [selectedLog, setSelectedLog] = useState<LogItem | null>(null);

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
                const userName = log.profiles?.name ?? "Sistem";
                return (
                  <button
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/30 w-full text-left transition-colors"
                  >
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
                    <Info className="h-4 w-4 text-slate-300 shrink-0 mt-1" />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Detail Aktivitas</DialogTitle>
            <DialogDescription>Informasi lengkap perubahan data.</DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Aksi</p>
                  <Badge className={`mt-1 ${ACTION_STYLES[selectedLog.action] || ""}`}>
                    {ACTION_LABELS[selectedLog.action] || selectedLog.action}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Entitas</p>
                  <p className="mt-1 font-medium text-slate-900 dark:text-white">
                    {ENTITY_LABELS[selectedLog.entity] || selectedLog.entity}
                    {selectedLog.entity_id && <span className="text-slate-400"> #{selectedLog.entity_id}</span>}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Oleh</p>
                  <p className="mt-1 flex items-center gap-1.5 text-slate-900 dark:text-white">
                    <User className="h-3.5 w-3.5 text-slate-400" />
                    {(selectedLog.profiles?.name ?? "Sistem")}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Waktu</p>
                  <p className="mt-1 flex items-center gap-1.5 text-slate-900 dark:text-white">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    {new Date(selectedLog.created_at).toLocaleString("id-ID")}
                  </p>
                </div>
              </div>

              {selectedLog.description && (
                <div className="rounded-lg bg-slate-50 dark:bg-slate-900/50 p-3">
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Deskripsi</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300">{selectedLog.description}</p>
                </div>
              )}

              {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                <div className="rounded-lg bg-slate-50 dark:bg-slate-900/50 p-3">
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">
                    <Hash className="h-3 w-3 inline mr-1" />
                    Data Perubahan (JSON)
                  </p>
                  <pre className="mt-1 max-h-48 overflow-auto rounded bg-slate-900 p-3 text-[11px] text-green-400 font-mono">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
