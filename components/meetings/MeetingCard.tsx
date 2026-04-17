/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * SPDX-License-Identifier: Elastic-2.0
 */

"use client";

import {
  CalendarClock,
  CalendarDays,
  MapPin,
  MoreHorizontal,
  Pencil,
  Trash2,
  Clock,
  Users,
  NotebookPen,
  CheckSquare,
  BriefcaseBusiness,
  Bot,
  UserPen,
  Eye,
} from "lucide-react";
import { LABEL_ICON_MAP } from "@/components/labels/label-icons";
import type { LabelIconName } from "@/components/labels/label-icons";
import { useTranslations, useLocale } from "next-intl";
import { cn, formatDateTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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

const SOURCE_META: Record<string, { label: string; Icon: React.ElementType }> =
  {
    google_calendar: { label: "Google", Icon: CalendarDays },
    llm: { label: "AI", Icon: Bot },
    manual: { label: "Manual", Icon: UserPen },
  };

type MeetingCardProps = {
  meeting: MeetingRecord;
  isUpdating: boolean;
  isDeleting: boolean;
  isGeneratingPrepPack: boolean;
  onEdit: (meeting: MeetingRecord) => void;
  onDelete: (meetingId: string) => void;
  onSummary: (meeting: MeetingRecord) => void;
  onPrepPack: (meeting: MeetingRecord) => void;
  onDetail: (meeting: MeetingRecord) => void;
};

export function MeetingCard({
  meeting,
  isUpdating,
  isDeleting,
  isGeneratingPrepPack,
  onEdit,
  onDelete,
  onSummary,
  onPrepPack,
  onDetail,
}: MeetingCardProps) {
  const t = useTranslations("meetings");

  const locale = useLocale();

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl border border-border/60 bg-card px-4 py-3 transition-opacity",
        (isUpdating || isDeleting || isGeneratingPrepPack) &&
          "opacity-60 pointer-events-none",
      )}
    >
      {/* Icon */}
      <div className="mt-0.5 shrink-0 text-muted-foreground">
        {meeting.kind === "appointment" ? (
          <CalendarDays className="size-5" />
        ) : (
          <CalendarClock className="size-5" />
        )}
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
          <div className="flex shrink-0 items-center gap-0.5">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={t("detailLabel")}
                      className="size-7 cursor-pointer text-muted-foreground"
                      onClick={() => onDetail(meeting)}
                    />
                  }
                >
                  <Eye className="size-3.5" />
                </TooltipTrigger>
                <TooltipContent>{t("detailLabel")}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={t("prepPackDialog.trigger")}
                      className="size-7 cursor-pointer text-muted-foreground"
                      onClick={() => onPrepPack(meeting)}
                    />
                  }
                >
                  <BriefcaseBusiness className="size-3.5" />
                </TooltipTrigger>
                <TooltipContent>{t("prepPackDialog.trigger")}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={t("summaryDialog.trigger")}
                      className="size-7 cursor-pointer text-muted-foreground"
                      onClick={() => onSummary(meeting)}
                    />
                  }
                >
                  <NotebookPen className="size-3.5" />
                </TooltipTrigger>
                <TooltipContent>{t("summaryDialog.trigger")}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={t("actionsLabel")}
                    className="size-7 cursor-pointer text-muted-foreground"
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
        </div>

        {meeting.summary && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {meeting.summary}
          </p>
        )}

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <CalendarClock className="size-3.5" />
            {formatDateTime(meeting.scheduledAt, locale)}
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
          {meeting.participants.length > 0 && (
            <span className="flex items-center gap-1">
              <Users className="size-3.5" />
              {meeting.participants.map((p) => p.contactName).join(", ")}
            </span>
          )}
          {meeting.tasks.length > 0 && (
            <span className="flex items-center gap-1">
              <CheckSquare className="size-3.5" />
              {meeting.tasks.map((t) => t.title).join(", ")}
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
          {meeting.labels.slice(0, 3).map((lbl) => {
            const Icon = lbl.icon
              ? LABEL_ICON_MAP[lbl.icon as LabelIconName]
              : null;
            return (
              <Badge
                key={lbl.id}
                variant="outline"
                className="border-transparent text-white text-xs gap-1"
                style={{ backgroundColor: lbl.color }}
              >
                {Icon && <Icon className="size-3 shrink-0" />}
                {lbl.name}
              </Badge>
            );
          })}
          {meeting.labels.length > 3 && (
            <Badge variant="outline" className="text-xs text-muted-foreground">
              +{meeting.labels.length - 3}
            </Badge>
          )}
          {/* Kind badge */}
          <Badge
            variant="outline"
            className={cn(
              "flex items-center gap-1 text-xs font-medium",
              meeting.kind === "appointment"
                ? "text-amber-600 border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30"
                : "text-violet-600 border-violet-200 bg-violet-50 dark:border-violet-800 dark:bg-violet-950/30",
            )}
          >
            {meeting.kind === "appointment" ? (
              <CalendarDays className="size-3 shrink-0" />
            ) : (
              <Users className="size-3 shrink-0" />
            )}
            {t(`kind.${meeting.kind}`)}
          </Badge>
          {/* Source badge */}
          {(() => {
            const meta = SOURCE_META[meeting.source] ?? SOURCE_META["manual"];
            return (
              <Badge
                variant="outline"
                className="flex items-center gap-1 text-xs text-muted-foreground"
              >
                <meta.Icon className="size-3 shrink-0" />
                {meta.label}
              </Badge>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
