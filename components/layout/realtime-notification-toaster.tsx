"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/lib/toast-provider";
import type { NotificationType } from "@/lib/types/notifications";

type ToastNotification = {
  id: number;
  title: string;
  message: string;
  type: NotificationType;
  link: string | null;
};

/**
 * Listens to Supabase Realtime for new notifications and
 * shows toast popups for important ones (warning, error, and large transactions).
 *
 * Usage: <RealtimeNotificationToaster />
 * Place once in dashboard layout.
 */
export function RealtimeNotificationToaster() {
  const { showToast } = useToast();
  const shownIds = useRef(new Set<number>());
  const userIdRef = useRef<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user?.id) return;
      userIdRef.current = session.user.id;

      supabase
        .channel(`notifications-toast-${session.user.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${session.user.id}`,
          },
          (payload) => {
            const notif = payload.new as ToastNotification;

            // Avoid duplicate toasts for same notification
            if (shownIds.current.has(notif.id)) return;
            shownIds.current.add(notif.id);

            // Limit shown IDs set size
            if (shownIds.current.size > 100) {
              const arr = [...shownIds.current];
              shownIds.current = new Set(arr.slice(-50));
            }

            // Show toast for important notifications
            if (notif.type === "error") {
              showToast(notif.message, "error", 6000);
            } else if (notif.type === "warning") {
              showToast(notif.message, "warning", 5000);
            } else if (notif.type === "success") {
              showToast(notif.message, "success", 4000);
            }
            // Skip "info" type — no toast needed
          },
        )
        .subscribe();
    });

    return () => {
      // Channel auto-cleanup via supabase client lifecycle
    };
  }, [showToast]);

  return null;
}
