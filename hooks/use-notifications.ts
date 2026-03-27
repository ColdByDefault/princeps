/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

"use client";

import * as React from "react";
import type { NotificationRecord } from "@/types/api";

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

  // Load initial list and open SSE stream
  React.useEffect(() => {
    let es: EventSource | null = null;

    async function init() {
      try {
        const res = await fetch("/api/notifications");
        if (res.ok) {
          const data = (await res.json()) as {
            notifications: NotificationRecord[];
          };
          setNotifications(data.notifications);
        }
      } catch {
        // Non-fatal — SSE will backfill unread ones
      }

      es = new EventSource("/api/notifications/stream");

      es.onmessage = (event: MessageEvent<string>) => {
        try {
          const notification = JSON.parse(event.data) as NotificationRecord;
          setNotifications((prev) => {
            // Deduplicate — the stream may resend unread records on reconnect
            if (prev.some((n) => n.id === notification.id)) return prev;
            return [notification, ...prev];
          });
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
