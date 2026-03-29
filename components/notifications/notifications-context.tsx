/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

"use client";

import * as React from "react";
import type { NotificationRecord } from "@/types/api";
import { useNotice } from "@/components/shared/notice-context";
import { useLanguage } from "@/hooks/use-language";

// Module-level set: tracks notification IDs that have already triggered a
// pop-up banner in this browser session. Persisted to sessionStorage so it
// survives page reloads (e.g. after cookie deletion) within the same tab session.
const SHOWN_KEY = "akhiil-shown-notices";

function loadShownIds(): Set<string> {
  if (typeof sessionStorage === "undefined") return new Set();
  try {
    const raw = sessionStorage.getItem(SHOWN_KEY);
    return new Set<string>(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

const shownNoticeIds: Set<string> = loadShownIds();

// Captured once when JS module first loads — used as a precise page-load
// cutoff so initial-fetch pop-ups only fire for notifications that were
// created around or after this page load, not from previous sessions.
const PAGE_LOAD_EPOCH =
  typeof performance !== "undefined" ? performance.timeOrigin : Date.now();

function addShownId(id: string): void {
  shownNoticeIds.add(id);
  if (typeof sessionStorage !== "undefined") {
    try {
      sessionStorage.setItem(SHOWN_KEY, JSON.stringify([...shownNoticeIds]));
    } catch {
      // sessionStorage unavailable (e.g. private mode quota) — degrade silently
    }
  }
}

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
  const { language } = useLanguage();

  // Keep DB language in sync with whatever the client is showing.
  // This ensures server-side hooks (e.g. greeting notifications) always
  // use the correct locale, even when the cookie was set by client-side
  // detection rather than an explicit user action.
  React.useEffect(() => {
    if (!authenticated) return;
    void fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language }),
    });
  }, [authenticated, language]);

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
            // Only pop notifications created around or after this page load.
            // Using PAGE_LOAD_EPOCH (not a rolling 30s window) prevents old
            // unread notifications from re-popping after a browser data wipe.
            const notifTime = new Date(n.createdAt).getTime();
            if (
              !n.read &&
              notifTime > PAGE_LOAD_EPOCH - 15_000 &&
              !shownNoticeIds.has(n.id)
            ) {
              addShownId(n.id);
              const isGreeting =
                n.category === "welcome_signup" ||
                n.category === "welcome_login";
              addNoticeRef.current({
                type: isGreeting ? "neutral" : "info",
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
            addShownId(notification.id);
            const isGreeting =
              notification.category === "welcome_signup" ||
              notification.category === "welcome_login";
            addNoticeRef.current({
              type: isGreeting ? "neutral" : "info",
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
