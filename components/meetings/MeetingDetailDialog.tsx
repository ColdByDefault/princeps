/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * SPDX-License-Identifier: Elastic-2.0
 */

"use client";

import {
  CalendarClock,
  MapPin,
  Clock,
  Users,
  CheckSquare,
  NotebookPen,
  BriefcaseBusiness,
  Pencil,
  Trash2,
  CalendarDays,
  Bot,
  UserPen,
} from "lucide-react";
import { LABEL_ICON_MAP } from "@/components/labels/label-icons";
import type { LabelIconName } from "@/components/labels/label-icons";
import { useTranslations, useLocale } from "next-intl";
import { cn, formatDateTime } from "@/lib/utils";
import type { MeetingRecord } from "@/types/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const STATUS_COLORS: Record<string, string> = {
  upcoming:
    "text-blue-600 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30",
  done: "text-green-600 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30",
  cancelled: "text-muted-foreground border-border bg-muted/40",
};

const SOURCE_META: Record<string, { label: string; Icon: React.ElementType }> =
  {
    google_calendar: {
      label: "Google Calendar",
      Icon: CalendarDays,
    },
    llm: {
      label: "AI",
      Icon: Bot,
    },
    manual: {
      label: "Manual",
      Icon: UserPen,
    },
  };

function getSourceMeta(source: string) {
  return SOURCE_META[source] ?? { label: source, Icon: CalendarDays };
}

interface MeetingDetailDialogProps {
  meeting: MeetingRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (meeting: MeetingRecord) => void;
  onDelete: (meetingId: string) => void;
  onSummary: (meeting: MeetingRecord) => void;
  onPrepPack: (meeting: MeetingRecord) => void;
}

export function MeetingDetailDialog({
  meeting,
  open,
  onOpenChange,
  onEdit,
  onDelete,
  onSummary,
  onPrepPack,
}: MeetingDetailDialogProps) {
  const t = useTranslations("meetings");
  const locale = useLocale();

  if (!meeting) return null;

  const sourceMeta = getSourceMeta(meeting.source);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle
            className={cn(
              "text-base font-semibold leading-snug pr-6",
              meeting.status === "cancelled" &&
                "line-through text-muted-foreground",
            )}
          >
            {meeting.title}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {t("detailDialog.description")}
          </DialogDescription>
        </DialogHeader>

        {/* Status + kind + source */}
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge
            variant="outline"
            className={cn("text-xs font-medium", STATUS_COLORS[meeting.status])}
          >
            {t(`status.${meeting.status}`)}
          </Badge>
          {meeting.kind === "appointment" && (
            <Badge variant="outline" className="text-xs text-muted-foreground">
              {t("kind.appointment")}
            </Badge>
          )}
          {meeting.source !== "manual" && (
            <Badge
              variant="outline"
              className="flex items-center gap-1 text-xs text-muted-foreground"
            >
              <sourceMeta.Icon className="size-3" />
              {sourceMeta.label}
            </Badge>
          )}
        </div>

        {/* Core meta */}
        <div className="space-y-1.5 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <CalendarClock className="size-3.5 shrink-0" />
            <span>{formatDateTime(meeting.scheduledAt, locale)}</span>
          </div>
          {meeting.durationMin != null && (
            <div className="flex items-center gap-2">
              <Clock className="size-3.5 shrink-0" />
              <span>
                {meeting.durationMin} {t("fields.minutesShort")}
              </span>
            </div>
          )}
          {meeting.location && (
            <div className="flex items-center gap-2">
              <MapPin className="size-3.5 shrink-0" />
              <span>{meeting.location}</span>
            </div>
          )}
        </div>

        {/* Agenda / description */}
        {meeting.agenda && (
          <>
            <Separator />
            <div>
              <p className="mb-1 text-xs font-medium text-foreground">
                {t("fields.agenda")}
              </p>
              <p className="text-sm text-muted-foreground whitespace-pre-line">
                {meeting.agenda}
              </p>
            </div>
          </>
        )}

        {/* Summary */}
        {meeting.summary && (
          <>
            <Separator />
            <div>
              <p className="mb-1 text-xs font-medium text-foreground">
                {t("fields.summary")}
              </p>
              <p className="text-sm text-muted-foreground whitespace-pre-line">
                {meeting.summary}
              </p>
            </div>
          </>
        )}

        {/* Participants */}
        {meeting.participants.length > 0 && (
          <>
            <Separator />
            <div>
              <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-foreground">
                <Users className="size-3.5" />
                {t("fields.participants")}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {meeting.participants.map((p) => (
                  <Badge
                    key={p.id}
                    variant="outline"
                    className="text-xs font-normal"
                  >
                    {p.contactName}
                  </Badge>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Linked tasks */}
        {meeting.tasks.length > 0 && (
          <>
            <Separator />
            <div>
              <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-foreground">
                <CheckSquare className="size-3.5" />
                {t("fields.linkedTasks")}
              </p>
              <div className="space-y-1">
                {meeting.tasks.map((task) => (
                  <p key={task.id} className="text-sm text-muted-foreground">
                    {task.title}
                  </p>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Labels */}
        {meeting.labels.length > 0 && (
          <>
            <Separator />
            <div className="flex flex-wrap gap-1.5">
              {meeting.labels.map((lbl) => {
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
            </div>
          </>
        )}

        <Separator />

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="cursor-pointer"
            aria-label={t("prepPackDialog.trigger")}
            onClick={() => {
              onOpenChange(false);
              onPrepPack(meeting);
            }}
          >
            <BriefcaseBusiness className="mr-1.5 size-3.5" />
            {t("prepPackDialog.trigger")}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="cursor-pointer"
            aria-label={t("summaryDialog.trigger")}
            onClick={() => {
              onOpenChange(false);
              onSummary(meeting);
            }}
          >
            <NotebookPen className="mr-1.5 size-3.5" />
            {t("summaryDialog.trigger")}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="cursor-pointer"
            aria-label={t("editLabel")}
            onClick={() => {
              onOpenChange(false);
              onEdit(meeting);
            }}
          >
            <Pencil className="mr-1.5 size-3.5" />
            {t("editLabel")}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="cursor-pointer text-muted-foreground hover:text-destructive ml-auto"
            aria-label={t("deleteLabel")}
            onClick={() => {
              onOpenChange(false);
              onDelete(meeting.id);
            }}
          >
            <Trash2 className="mr-1.5 size-3.5" />
            {t("deleteLabel")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
