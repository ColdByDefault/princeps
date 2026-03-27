/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

"use client";

import { Bell } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { NotificationItem } from "./NotificationItem";
import { useNotifications } from "@/hooks/use-notifications";
import { getMessage } from "@/lib/i18n";
import { type MessageDictionary } from "@/types/i18n";
import { cn } from "@/lib/utils";

type Props = {
  messages: MessageDictionary;
};

export function NotificationPanel({ messages }: Props) {
  const { notifications, unreadCount, markRead, dismiss } = useNotifications();

  return (
    <Sheet>
      <SheetTrigger>
        <Button
          variant="ghost"
          size="icon"
          className="relative cursor-pointer"
          aria-label={getMessage(
            messages,
            "notifications.bell",
            "Notifications",
          )}
        >
          <Bell className="size-4" />
          {unreadCount > 0 && (
            <span
              className={cn(
                "absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-blue-500 text-[10px] font-semibold text-white",
              )}
              aria-hidden
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent
        side="right"
        className="flex w-80 flex-col gap-0 p-0 sm:w-96"
      >
        <SheetHeader className="border-b px-4 py-3">
          <SheetTitle className="text-sm font-semibold">
            {getMessage(messages, "notifications.panelTitle", "Notifications")}
            {unreadCount > 0 && (
              <span className="ml-2 rounded-full bg-blue-100 px-1.5 py-0.5 text-[11px] font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                {unreadCount}
              </span>
            )}
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="flex flex-col gap-2 p-3">
            {notifications.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {getMessage(
                  messages,
                  "notifications.empty",
                  "No notifications yet.",
                )}
              </p>
            ) : (
              notifications.map((n) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  messages={messages}
                  onMarkRead={markRead}
                  onDismiss={dismiss}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
