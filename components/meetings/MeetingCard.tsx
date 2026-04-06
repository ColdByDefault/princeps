/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

"use client";

import {
  CalendarClock,
  MapPin,
  MoreHorizontal,
  Pencil,
  Trash2,
  Clock,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { MeetingRecord } from "@/types/api";

const STATUS_COLORS: Record<string, string> = {
  upcoming:
    "text-blue-600 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30",
  done: "text-green-600 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30",
  cancelled: "text-muted-foreground border-border bg-muted/40",
};

type MeetingCardProps = {
  meeting: MeetingRecord;
  isUpdating: boolean;
  isDeleting: boolean;
  onEdit: (meeting: MeetingRecord) => void;
  onDelete: (meetingId: string) => void;
};

export function MeetingCard({
  meeting,
  isUpdating,
  isDeleting,
  onEdit,
  onDelete,
}: MeetingCardProps) {
  const t = useTranslations("meetings");

  function formatScheduled(iso: string) {
    return new Date(iso).toLocaleString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl border border-border/60 bg-card px-4 py-3 transition-opacity",
        (isUpdating || isDeleting) && "opacity-60 pointer-events-none",
      )}
    >
      {/* Icon */}
      <div className="mt-0.5 shrink-0 text-muted-foreground">
        <CalendarClock className="size-5" />
      </div>

      {/* Body */}
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <p
            className={cn(
              "text-sm font-medium leading-snug",
              meeting.status === "cancelled" &&
                "line-through text-muted-foreground",
            )}
          >
            {meeting.title}
          </p>

          {/* Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={t("actionsLabel")}
                  title={t("actionsLabel")}
                  className="size-7 cursor-pointer shrink-0 text-muted-foreground"
                />
              }
            >
              <MoreHorizontal className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => onEdit(meeting)}
                className="cursor-pointer"
              >
                <Pencil className="mr-2 size-3.5" />
                {t("editLabel")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(meeting.id)}
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 size-3.5" />
                {t("deleteLabel")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <CalendarClock className="size-3.5" />
            {formatScheduled(meeting.scheduledAt)}
          </span>
          {meeting.durationMin != null && (
            <span className="flex items-center gap-1">
              <Clock className="size-3.5" />
              {meeting.durationMin} {t("fields.minutesShort")}
            </span>
          )}
          {meeting.location && (
            <span className="flex items-center gap-1">
              <MapPin className="size-3.5" />
              {meeting.location}
            </span>
          )}
        </div>

        {/* Status + labels */}
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          <Badge
            variant="outline"
            className={cn("text-xs font-medium", STATUS_COLORS[meeting.status])}
          >
            {t(`status.${meeting.status}`)}
          </Badge>
          {meeting.labels.map((lbl) => (
            <Badge
              key={lbl.id}
              variant="outline"
              className="border-transparent text-white text-xs"
              style={{ backgroundColor: lbl.color }}
            >
              {lbl.name}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}
