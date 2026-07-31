"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";
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

type UseRealtimeNotificationsOptions = {
    /** Max notifications to keep in state (default 5) */
    limit?: number;
};

type UseRealtimeNotificationsReturn = {
    notifications: UiNotification[];
    unreadCount: number;
    isLoading: boolean;
    refresh: () => Promise<void>;
    markAllRead: () => Promise<void>;
    markOneRead: (id: number) => Promise<void>;
};

/**
 * Custom hook for real-time notifications via Supabase Realtime.
 *
 * Features:
 * - Initial fetch + real-time INSERT subscription
 * - UPDATE subscription (mark as read syncs across tabs)
 * - 30-second polling fallback
 * - Unread count badge
 */
export function useRealtimeNotifications(
    options: UseRealtimeNotificationsOptions = {},
): UseRealtimeNotificationsReturn {
    const { limit = 5 } = options;
    const [notifications, setNotifications] = useState<UiNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    // Refs to keep latest values accessible in the realtime callback without
    // triggering effect re-runs (avoids channel re-subscription loops).
    // React 19: sync refs in useEffect, not during render.
    const limitRef = useRef(limit);
    useEffect(() => {
        limitRef.current = limit;
    });

    const refresh = useCallback(async () => {
        try {
            const params = new URLSearchParams({
                limit: String(limitRef.current),
            });
            const res = await fetch(`/api/notifications?${params}`);
            if (!res.ok) return;
            const json = await res.json();
            setNotifications(json.data ?? []);
            setUnreadCount(json.totalUnread ?? 0);
        } catch (err) {
            console.error("Failed to load notifications:", err);
        } finally {
            setIsLoading(false);
        }
    }, []); // Stable — uses limitRef

    const refreshRef = useRef(refresh);
    useEffect(() => {
        refreshRef.current = refresh;
    });

    const markAllRead = useCallback(async () => {
        try {
            await fetch("/api/notifications", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({}),
            });
            setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
            setUnreadCount(0);
        } catch (err) {
            console.error("Failed to mark all read:", err);
        }
    }, []);

    const markOneRead = useCallback(async (id: number) => {
        try {
            await fetch("/api/notifications", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ notificationId: id }),
            });
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
        } catch (err) {
            console.error("Failed to mark notification read:", err);
        }
    }, []);

    // ── Real-time subscription + initial load ──────────────────────
    useEffect(() => {
        let cancelled = false;

        // Initial fetch
        refresh();

        const supabase = createClient();
        let channel: RealtimeChannel | null = null;

        async function setupRealtime() {
            const {
                data: { session },
            } = await supabase.auth.getSession();

            // Abort if unmounted, no session, or channel already set up
            // (the `|| channel` guard defends against StrictMode double-
            //  invoke race where both async setups resolve after re-mount)
            if (cancelled || !session?.user?.id || channel) return;

            channel = supabase
                .channel(`notifications-${session.user.id}`)
                .on(
                    "postgres_changes",
                    {
                        event: "INSERT",
                        schema: "public",
                        table: "notifications",
                        filter: `user_id=eq.${session.user.id}`,
                    },
                    (payload) => {
                        const newNotif = payload.new as UiNotification;
                        setNotifications((prev) =>
                            [newNotif, ...prev].slice(0, limitRef.current),
                        );
                        setUnreadCount((prev) => prev + 1);
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
                    (payload) => {
                        const updated = payload.new as UiNotification;
                        setNotifications((prev) =>
                            prev.map((n) =>
                                n.id === updated.id ? updated : n,
                            ),
                        );
                        // Recalculate unread count from server
                        refreshRef.current();
                    },
                )
                .subscribe();
        }

        setupRealtime();

        // Poll every 30 seconds as fallback
        const interval = setInterval(refresh, 30000);

        return () => {
            cancelled = true;
            clearInterval(interval);
            // .unsubscribe() properly tears down the realtime connection
            // so a future channel with the same name can be re-created.
            if (channel) {
                channel.unsubscribe();
                supabase.removeChannel(channel);
            }
        };
        // refresh is stable (useCallback with [] deps), so including it
        // in the dep array does NOT cause re-subscription loops.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return {
        notifications,
        unreadCount,
        isLoading,
        refresh,
        markAllRead,
        markOneRead,
    };
}
