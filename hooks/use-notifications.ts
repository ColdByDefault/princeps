/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version canary-v1.1.9
 * @since beta
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import type { NotificationRecord } from "@/types/api";

// sessionStorage key used to deduplicate the greeting call within a browser tab session.
// sessionStorage survives page refreshes but is cleared when the tab is closed.
// It is also synchronous, so the second NotificationBell instance (desktop + mobile both
// render the bell) sees the flag on the very same render cycle and skips the API call.
// Exported so logout handlers can clear it when the auth session ends.
export const GREETING_SESSION_KEY = "ss-greeting-fired";
// Tracks which greeting notification already surfaced as a toast in this tab.
export const GREETING_TOAST_SESSION_KEY = "ss-greeting-toast-id";
const NOTIFICATION_TOAST_DURATION_MS = 6000;

function getTodaysUnreadGreeting(
  notifications: NotificationRecord[],
): NotificationRecord | null {
  const todayUtc = new Date().toISOString().slice(0, 10);

  for (const notification of notifications) {
    if (notification.category !== "daily_greeting" || notification.read) {
      continue;
    }

    const metadata = notification.metadata;
    if (!metadata || typeof metadata !== "object") {
      continue;
    }

    const date = (metadata as Record<string, unknown>).date;
    if (typeof date === "string" && date === todayUtc) {
      return notification;
    }
  }

  return null;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const toastGreetingOnce = useCallback((notification: NotificationRecord) => {
    if (
      sessionStorage.getItem(GREETING_TOAST_SESSION_KEY) === notification.id
    ) {
      return;
    }
    sessionStorage.setItem(GREETING_TOAST_SESSION_KEY, notification.id);
    toast(notification.title, {
      description: notification.body,
      duration: NOTIFICATION_TOAST_DURATION_MS,
    });
  }, []);

  const maybeToastFromList = useCallback(
    (items: NotificationRecord[]) => {
      const todaysGreeting = getTodaysUnreadGreeting(items);
      if (!todaysGreeting) return;
      toastGreetingOnce(todaysGreeting);
    },
    [toastGreetingOnce],
  );

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data = (await res.json()) as {
        notifications: NotificationRecord[];
      };
      setNotifications(data.notifications);
      maybeToastFromList(data.notifications);
    } catch {
      // Non-critical
    }
  }, [maybeToastFromList]);

  // Initial load + greeting (greeting fires at most once per browser tab session)
  useEffect(() => {
    async function fetchNotifications() {
      try {
        const res = await fetch("/api/notifications");
        if (!res.ok) return;
        const data = (await res.json()) as {
          notifications: NotificationRecord[];
        };
        setNotifications(data.notifications);
        maybeToastFromList(data.notifications);
      } finally {
        setLoading(false);
      }
    }

    async function fireGreeting() {
      try {
        const res = await fetch("/api/notifications/greeting", {
          method: "POST",
        });
        if (!res.ok) return;
        const data = (await res.json()) as {
          created: boolean;
          notification: NotificationRecord | null;
        };
        if (data.created && data.notification) {
          const createdNotification = data.notification;
          setNotifications((prev) => {
            if (prev.some((n) => n.id === createdNotification.id)) {
              return prev;
            }
            return [createdNotification, ...prev];
          });
          toastGreetingOnce(createdNotification);
        }
      } catch {
        // Non-critical — greeting failure is silent
      }
    }

    void fetchNotifications();
    if (!sessionStorage.getItem(GREETING_SESSION_KEY)) {
      sessionStorage.setItem(GREETING_SESSION_KEY, "1");
      void fireGreeting();
    }

    // Re-fetch when a chat stream signals new server-side notifications were created.
    function handleRefresh() {
      void refresh();
    }
    window.addEventListener("notifications:refresh", handleRefresh);
    return () => {
      window.removeEventListener("notifications:refresh", handleRefresh);
    };
  }, [refresh, maybeToastFromList, toastGreetingOnce]);

  const markRead = useCallback(async (id: string) => {
    // Optimistic
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
    try {
      await fetch(`/api/notifications/${id}`, { method: "PATCH" });
    } catch {
      // Revert on failure
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: false } : n)),
      );
    }
  }, []);

  const deleteOne = useCallback(async (id: string) => {
    // Optimistic remove
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    try {
      await fetch(`/api/notifications/${id}`, { method: "DELETE" });
    } catch {
      // Revert on failure
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = (await res.json()) as {
          notifications: NotificationRecord[];
        };
        setNotifications(data.notifications);
      }
    }
  }, []);

  const deleteAll = useCallback(async () => {
    setNotifications([]);
    try {
      await fetch("/api/notifications", { method: "DELETE" });
    } catch {
      // Revert on failure
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = (await res.json()) as {
          notifications: NotificationRecord[];
        };
        setNotifications(data.notifications);
      }
    }
  }, []);

  return {
    notifications,
    unreadCount,
    loading,
    markRead,
    deleteOne,
    deleteAll,
    refresh,
  };
}
