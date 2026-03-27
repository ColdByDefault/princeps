/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

"use client";

import * as React from "react";
import type { NotificationRecord } from "@/types/api";
import { useNotice } from "@/components/shared/notice-context";

interface UseNotificationsReturn {
  notifications: NotificationRecord[];
  unreadCount: number;
  markRead: (id: string) => void;
  dismiss: (id: string) => void;
}

export function useNotifications(): UseNotificationsReturn {
  const [notifications, setNotifications] = React.useState<
    NotificationRecord[]
  >([]);
  const { addNotice } = useNotice();
  // Ref so the SSE handler always sees the latest addNotice without re-running the effect
  const addNoticeRef = React.useRef(addNotice);
  React.useEffect(() => {
    addNoticeRef.current = addNotice;
  }, [addNotice]);

  // Load initial list and open SSE stream
  React.useEffect(() => {
    let es: EventSource | null = null;
    const initialIds = new Set<string>();

    async function init() {
      try {
        const res = await fetch("/api/notifications");
        if (res.ok) {
          const data = (await res.json()) as {
            notifications: NotificationRecord[];
          };
          setNotifications(data.notifications);
          for (const n of data.notifications) {
            initialIds.add(n.id);
            // Show popup for very-fresh notifications (generated just after
            // sign-up / login) so the welcome message is always visible.
            const ageMs = Date.now() - new Date(n.createdAt).getTime();
            if (!n.read && ageMs < 30_000) {
              addNoticeRef.current({
                type: "info",
                title: n.title,
                message: n.body,
                duration: 5000,
              });
            }
          }
        }
      } catch {
        // Non-fatal — SSE will backfill unread ones
      }

      es = new EventSource("/api/notifications/stream");

      es.onmessage = (event: MessageEvent<string>) => {
        try {
          const notification = JSON.parse(event.data) as NotificationRecord;
          setNotifications((prev) => {
            if (prev.some((n) => n.id === notification.id)) return prev;
            return [notification, ...prev];
          });

          // Only pop for IDs that weren't in the initial REST fetch
          // (i.e. genuinely new live-pushed notifications).
          if (!initialIds.has(notification.id)) {
            addNoticeRef.current({
              type: "info",
              title: notification.title,
              message: notification.body,
              duration: 5000,
            });
          }
        } catch {
          // Malformed event — ignore
        }
      };
    }

    void init();

    return () => {
      es?.close();
    };
  }, []);

  const markRead = React.useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
    void fetch(`/api/notifications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ read: true }),
    });
  }, []);

  const dismiss = React.useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    void fetch(`/api/notifications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dismissed: true }),
    });
  }, []);

  const unreadCount = React.useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  );

  return { notifications, unreadCount, markRead, dismiss };
}
