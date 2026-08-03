"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  Bell,
  CheckCheck,
  AlertCircle,
  Info,
  CheckCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import type { NotificationType } from "@/lib/types/notifications";

type UiNotification = {
  id: number;
  title: string;
  message: string;
  type: NotificationType;
  is_read: boolean;
  link: string | null;
  created_at: string;
};

const TYPE_ICONS: Record<NotificationType, typeof Info> = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: AlertCircle,
};

const TYPE_COLORS: Record<NotificationType, string> = {
  info: "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30",
  success: "text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30",
  warning: "text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30",
  error: "text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30",
};

const ITEMS_PER_PAGE = 10;

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<UiNotification[]>([]);
  const [totalUnread, setTotalUnread] = useState(0);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const refreshRef = useRef(page);

  // Sinkronkan ref dengan page TANPA mengakses ref saat render
  useEffect(() => {
    refreshRef.current = page;
  }, [page]);

  const loadNotifications = useCallback(async (p = page) => {
    const res = await fetch(`/api/notifications?page=${p}&limit=${ITEMS_PER_PAGE}`);
    if (!res.ok) return;
    const json = await res.json();
    setNotifications(json.data ?? []);
    setTotalUnread(json.totalUnread ?? 0);
    setTotal(json.total ?? 0);
  }, [page]);

  // Muat data saat page berubah — setState dipanggil di dalam async (setelah await),
  // bukan sinkron di body effect, supaya memenuhi React Compiler rules.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch(`/api/notifications?page=${page}&limit=${ITEMS_PER_PAGE}`);
      if (cancelled || !res.ok) return;
      const json = await res.json();
      setNotifications(json.data ?? []);
      setTotalUnread(json.totalUnread ?? 0);
      setTotal(json.total ?? 0);
    })();
    return () => {
      cancelled = true;
    };
  }, [page]);

  // ── Real-time: refresh when new notification arrives ─────────────
  useEffect(() => {
    const supabase = createClient();
    let active = true;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!active || !session?.user?.id) return;

      const topic = `notifications-page-${session.user.id}`;

      // StrictMode double-mount: pastikan channel lama dihapus dulu
      // sebelum menambah callback (kalau tidak → "cannot add ... after subscribe()")
      supabase.removeChannel(supabase.channel(topic));

      channel = supabase
        .channel(topic)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${session.user.id}`,
          },
          () => {
            // Refresh current page when new notification comes in
            if (active) loadNotifications(refreshRef.current);
          },
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${session.user.id}`,
          },
          () => {
            if (active) loadNotifications(refreshRef.current);
          },
        )
        .subscribe();
    });

    return () => {
      active = false;
      if (channel) {
        supabase.removeChannel(channel);
        channel = null;
      }
    };
  }, [loadNotifications]);

  async function handleMarkAllRead() {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setTotalUnread(0);
    } catch (err) {
      console.error("Failed to mark all read:", err);
    }
  }

  async function handleMarkRead(id: number) {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: id }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
      );
      setTotalUnread((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark read:", err);
    }
  }

  function formatTime(dateStr: string) {
    return new Date(dateStr).toLocaleString("id-ID", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Notifikasi
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {totalUnread > 0
              ? `${totalUnread} notifikasi belum dibaca`
              : "Semua notifikasi sudah dibaca"}
          </p>
        </div>
        {totalUnread > 0 && (
          <Button
            onClick={handleMarkAllRead}
            variant="outline"
            className="gap-2"
          >
            <CheckCheck className="h-4 w-4" />
            Tandai Semua Dibaca
          </Button>
        )}
      </div>

      {/* List */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-slate-400">
            <Bell className="h-12 w-12 mb-3 opacity-30" />
            <p className="text-sm font-medium">Belum ada notifikasi</p>
            <p className="text-xs mt-1">Notifikasi akan muncul di sini</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
            {notifications.map((n) => {
              const Icon = TYPE_ICONS[n.type];
              const content = (
                <div
                  key={n.id}
                  className={`flex items-start gap-4 px-6 py-4 transition-colors ${
                    !n.is_read
                      ? "bg-sky-50/50 dark:bg-sky-900/10"
                      : "hover:bg-slate-50 dark:hover:bg-slate-700/30"
                  }`}
                >
                  <div className={`p-2 rounded-lg shrink-0 ${TYPE_COLORS[n.type]}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p
                          className={`text-sm ${
                            !n.is_read ? "font-semibold" : "font-medium"
                          } text-slate-900 dark:text-white`}
                        >
                          {n.title}
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                          {n.message}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {!n.is_read && (
                          <button
                            onClick={() => handleMarkRead(n.id)}
                            className="p-1 text-slate-400 hover:text-sky-600 transition-colors cursor-pointer"
                            title="Tandai dibaca"
                          >
                            <CheckCheck className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-slate-400">{formatTime(n.created_at)}</span>
                      {n.link && (
                        <Link
                          href={n.link}
                          className="text-xs text-sky-600 hover:text-sky-700 font-medium"
                        >
                          Lihat Detail
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
              return content;
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-700 px-6 py-3">
            <p className="text-sm text-slate-500">
              Halaman {page} dari {totalPages}
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
