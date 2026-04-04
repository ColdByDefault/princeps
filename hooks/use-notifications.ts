/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { NotificationRecord } from "@/types/api";

export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const greetingFired = useRef(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Initial load
  useEffect(() => {
    void fetchNotifications();
  }, []);

  async function fetchNotifications() {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data = (await res.json()) as {
        notifications: NotificationRecord[];
      };
      setNotifications(data.notifications);
    } finally {
      setLoading(false);
    }
  }

  const triggerGreeting = useCallback(async () => {
    if (greetingFired.current) return;
    greetingFired.current = true;

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
        setNotifications((prev) => [data.notification!, ...prev]);
      }
    } catch {
      // Non-critical — greeting failure is silent
    }
  }, []);

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
      void fetchNotifications();
    }
  }, []);

  const deleteAll = useCallback(async () => {
    setNotifications([]);
    try {
      await fetch("/api/notifications", { method: "DELETE" });
    } catch {
      void fetchNotifications();
    }
  }, []);

  return {
    notifications,
    unreadCount,
    loading,
    triggerGreeting,
    markRead,
    deleteOne,
    deleteAll,
  };
}
