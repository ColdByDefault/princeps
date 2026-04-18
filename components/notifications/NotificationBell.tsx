/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version beta
 * @since beta
 * @module
 * @description
 */

"use client";

import { useState, useSyncExternalStore } from "react";
import { Bell } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { NotificationDrawer } from "./NotificationDrawer";
import { useNotifications } from "@/hooks/use-notifications";

export function NotificationBell() {
  const t = useTranslations("notifications");
  const [open, setOpen] = useState(false);
  // Prevents hydration mismatch: Base UI ButtonPrimitive applies the native `disabled`
  // attribute only on the client. Guard it so server and client initial renders agree.
  const isHydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const {
    notifications,
    unreadCount,
    loading,
    markRead,
    deleteOne,
    deleteAll,
  } = useNotifications();

  function handleBellClick() {
    setOpen(true);
  }

  function handleOpenChange(next: boolean) {
    // Mark all unread as read when the drawer closes (user has seen the notifications)
    if (!next) {
      notifications.filter((n) => !n.read).forEach((n) => void markRead(n.id));
    }
    setOpen(next);
  }

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger
            render={
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
                disabled={isHydrated && loading}
                onClick={handleBellClick}
              />
            }
          >
            <Bell className="size-3.5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex size-3.5 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground leading-none">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </TooltipTrigger>
          <TooltipContent>
            {unreadCount > 0
              ? t("bell.unread", { count: unreadCount })
              : t("bell.ariaLabel")}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

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
