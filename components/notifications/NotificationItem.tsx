/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

"use client";

import { CheckCheck, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { type NotificationRecord } from "@/types/api";
import { getMessage } from "@/lib/i18n";
import { type MessageDictionary } from "@/types/i18n";

type Props = {
  notification: NotificationRecord;
  messages: MessageDictionary;
  onMarkRead: (id: string) => void;
  onDismiss: (id: string) => void;
};

export function NotificationItem({
  notification,
  messages,
  onMarkRead,
  onDismiss,
}: Props) {
  const isNew = !notification.read;
  const isGreeting =
    notification.category === "welcome_signup" ||
    notification.category === "welcome_login";

  return (
    <div
      className={cn(
        "group relative flex flex-col gap-1 rounded-lg border p-3 text-sm transition-colors",
        isNew && !isGreeting
          ? "border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/30"
          : "border-border bg-muted/30",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          {isNew && !isGreeting && (
            <Badge
              variant="secondary"
              className="shrink-0 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 text-[10px] px-1.5 py-0"
            >
              {getMessage(messages, "notifications.new", "New")}
            </Badge>
          )}
          <span className="font-medium leading-snug truncate">
            {notification.title}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {isNew && !isGreeting && (
            <Button
              variant="ghost"
              size="icon"
              className="size-6 cursor-pointer"
              aria-label={getMessage(
                messages,
                "notifications.markRead",
                "Mark as read",
              )}
              onClick={() => onMarkRead(notification.id)}
            >
              <CheckCheck className="size-3.5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="size-6 cursor-pointer"
            aria-label={getMessage(
              messages,
              "notifications.dismiss",
              "Dismiss",
            )}
            onClick={() => onDismiss(notification.id)}
          >
            <X className="size-3.5" />
          </Button>
        </div>
      </div>

      <p className="text-muted-foreground leading-relaxed">
        {notification.body}
      </p>

      <time
        dateTime={notification.createdAt}
        className="text-[11px] text-muted-foreground/70"
      >
        {new Date(notification.createdAt).toLocaleString()}
      </time>
    </div>
  );
}
