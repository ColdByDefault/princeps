/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

"use client";

import * as React from "react";
import type { NotificationRecord } from "@/types/api";
import { useNotice } from "@/components/shared/notice-context";

// Module-level set: tracks notification IDs that have already triggered a
// pop-up banner in this browser session. Survives context remounts.
const shownNoticeIds = new Set<string>();

interface NotificationsContextValue {
  notifications: NotificationRecord[];
  unreadCount: number;
  markRead: (id: string) => void;
  dismiss: (id: string) => void;
}

const NotificationsContext = React.createContext<
  NotificationsContextValue | undefined
>(undefined);

export function NotificationsProvider({
  children,
  authenticated,
}: {
  children: React.ReactNode;
  authenticated: boolean;
}) {
  const [notifications, setNotifications] = React.useState<
    NotificationRecord[]
  >([]);
  const { addNotice } = useNotice();

  // Ref so the SSE handler always sees the latest addNotice without re-running the effect
  const addNoticeRef = React.useRef(addNotice);
  React.useEffect(() => {
    addNoticeRef.current = addNotice;
  }, [addNotice]);

  // Establish the SSE connection once for the lifetime of the provider.
  // The provider lives in the root layout and is never unmounted, so this
  // effect runs exactly once per browser session — no reconnect on navigation.
  // Guard behind `authenticated` so unauthenticated pages never hit the API.
  React.useEffect(() => {
    if (!authenticated) return;
    let es: EventSource | null = null;
    let cancelled = false;
    const initialIds = new Set<string>();

    async function init() {
      try {
        const res = await fetch("/api/notifications");
        if (cancelled) return;
        if (res.ok) {
          const data = (await res.json()) as {
            notifications: NotificationRecord[];
          };
          if (cancelled) return;
          setNotifications(data.notifications);
          for (const n of data.notifications) {
            initialIds.add(n.id);
            const ageMs = Date.now() - new Date(n.createdAt).getTime();
            if (!n.read && ageMs < 30_000 && !shownNoticeIds.has(n.id)) {
              shownNoticeIds.add(n.id);
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

      if (cancelled) return;

      es = new EventSource("/api/notifications/stream");

      es.onmessage = (event: MessageEvent<string>) => {
        try {
          const notification = JSON.parse(event.data) as NotificationRecord;
          setNotifications((prev) => {
            if (prev.some((n) => n.id === notification.id)) return prev;
            return [notification, ...prev];
          });

          if (
            !initialIds.has(notification.id) &&
            !shownNoticeIds.has(notification.id)
          ) {
            shownNoticeIds.add(notification.id);
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
      cancelled = true;
      es?.close();
    };
  }, [authenticated]);

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

  return (
    <NotificationsContext.Provider
      value={{ notifications, unreadCount, markRead, dismiss }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotificationsContext(): NotificationsContextValue {
  const ctx = React.useContext(NotificationsContext);
  if (!ctx) {
    throw new Error(
      "useNotificationsContext must be used within NotificationsProvider",
    );
  }
  return ctx;
}
