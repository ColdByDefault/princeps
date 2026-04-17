/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * SPDX-License-Identifier: Elastic-2.0
 */

"use client";

import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { NotificationRecord } from "@/types/api";

type NotificationItemProps = {
  notification: NotificationRecord;
  onDelete: (id: string) => void;
};

function formatRelativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export function NotificationItem({
  notification,
  onDelete,
}: NotificationItemProps) {
  const t = useTranslations("notifications");

  return (
    <div
      className={cn(
        "group relative flex flex-col gap-1 rounded-lg border border-border/50 bg-card p-3 transition-colors",
        !notification.read && "border-l-2 border-l-primary/60",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-medium leading-snug text-foreground">
          {notification.title}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={t("deleteOne.ariaLabel")}
          className="cursor-pointer shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => onDelete(notification.id)}
        >
          <X className="size-3.5" />
        </Button>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
        {notification.body}
      </p>
      <span className="text-xs text-muted-foreground/60 mt-0.5">
        {formatRelativeTime(notification.createdAt)}
      </span>
    </div>
  );
}
