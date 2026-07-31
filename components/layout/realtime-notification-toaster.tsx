"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/lib/toast-provider";
import type { NotificationType } from "@/lib/types/notifications";
import type { RealtimeChannel } from "@supabase/supabase-js";

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

  // Keep showToast in a ref so the realtime callback never goes stale
  // without triggering effect re-runs (React 19: sync ref in effect).
  const showToastRef = useRef(showToast);
  useEffect(() => {
    showToastRef.current = showToast;
  });

  useEffect(() => {
    const supabase = createClient();
    let channel: RealtimeChannel | null = null;
    let cancelled = false;

    async function setupRealtime() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      // Abort if unmounted, no session, or channel already set up
      // (the `|| channel` guard defends against StrictMode double-invoke
      //  race where both async setups resolve after the second mount)
      if (cancelled || !session?.user?.id || channel) return;

      channel = supabase
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

            const toast = showToastRef.current;

            if (notif.type === "error") {
              toast(notif.message, "error", 6000);
            } else if (notif.type === "warning") {
              toast(notif.message, "warning", 5000);
            } else if (notif.type === "success") {
              toast(notif.message, "success", 4000);
            }
            // Skip "info" type — no toast needed
          },
        )
        .subscribe();
    }

    setupRealtime();

    return () => {
      cancelled = true;
      if (channel) {
        channel.unsubscribe();
        supabase.removeChannel(channel);
      }
    };
  }, []);

  return null;
}
