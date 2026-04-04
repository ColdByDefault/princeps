/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

"use client";

import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { NotificationDrawer } from "./NotificationDrawer";
import { useNotifications } from "@/hooks/use-notifications";

export function NotificationBell() {
  const t = useTranslations("notifications");
  const [open, setOpen] = useState(false);
  const {
    notifications,
    unreadCount,
    loading,
    triggerGreeting,
    markRead,
    deleteOne,
    deleteAll,
  } = useNotifications();

  // Fire greeting once on mount (once per session, hook guards against double-fire)
  useEffect(() => {
    void triggerGreeting();
  }, [triggerGreeting]);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    // Mark all unread as read when drawer opens
    if (next) {
      notifications.filter((n) => !n.read).forEach((n) => void markRead(n.id));
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        aria-label={
          unreadCount > 0
            ? t("bell.unread", { count: unreadCount })
            : t("bell.ariaLabel")
        }
        className="cursor-pointer relative rounded-full border-border/70 bg-background/70 backdrop-blur-sm"
        disabled={loading}
        onClick={() => handleOpenChange(true)}
      >
        <Bell className="size-3.5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex size-3.5 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground leading-none">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      <NotificationDrawer
        open={open}
        onOpenChange={handleOpenChange}
        notifications={notifications}
        onDeleteOne={deleteOne}
        onDeleteAll={deleteAll}
      />
    </>
  );
}
