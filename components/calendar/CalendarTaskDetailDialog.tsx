/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

"use client";

import { Pencil, Trash2, CalendarDays, Tag, Target, Link2 } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { LABEL_ICON_MAP } from "@/components/labels/label-icons";
import type { LabelIconName } from "@/components/labels/label-icons";
import { formatDate, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { TaskRecord } from "@/types/api";

const STATUS_COLORS: Record<string, string> = {
  open: "text-blue-600 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30",
  in_progress:
    "text-yellow-600 border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/30",
  done: "text-green-600 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30",
  cancelled: "text-muted-foreground border-border bg-muted/40",
};

const PRIORITY_COLORS: Record<string, string> = {
  urgent:
    "text-red-500 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30",
  high: "text-orange-500 border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/30",
  normal:
    "text-blue-500 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30",
  low: "text-muted-foreground border-border bg-muted/40",
};

function statusKey(status: string): string {
  return status === "in_progress" ? "inProgress" : status;
}

interface CalendarTaskDetailDialogProps {
  task: TaskRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (task: TaskRecord) => void;
  onDelete: (taskId: string) => void;
}

export function CalendarTaskDetailDialog({
  task,
  open,
  onOpenChange,
  onEdit,
  onDelete,
}: CalendarTaskDetailDialogProps) {
  const t = useTranslations("tasks");
  const tCal = useTranslations("calendar");
  const locale = useLocale();

  if (!task) return null;

  const isDone = task.status === "done";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle
            className={cn(
              "text-base font-semibold leading-snug pr-6",
              isDone && "line-through text-muted-foreground",
            )}
          >
            {task.title}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {tCal("taskDetailDescription")}
          </DialogDescription>
        </DialogHeader>

        {/* Status + Priority */}
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge
            variant="outline"
            className={cn(
              "text-xs font-medium",
              STATUS_COLORS[task.status] ?? STATUS_COLORS.open,
            )}
          >
            {t(`status.${statusKey(task.status)}`)}
          </Badge>
          <Badge
            variant="outline"
            className={cn(
              "text-xs font-medium",
              PRIORITY_COLORS[task.priority] ?? PRIORITY_COLORS.normal,
            )}
          >
            {t(`priority.${task.priority}`)}
          </Badge>
        </div>

        {/* Due date */}
        {task.dueDate && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarDays className="size-3.5 shrink-0" />
            <span>{formatDate(task.dueDate, locale)}</span>
          </div>
        )}

        {/* Notes */}
        {task.notes && (
          <>
            <Separator />
            <p className="text-sm text-muted-foreground whitespace-pre-line">
              {task.notes}
            </p>
          </>
        )}

        {/* Labels */}
        {task.labels.length > 0 && (
          <>
            <Separator />
            <div>
              <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-foreground">
                <Tag className="size-3.5" />
                {t("fields.labels")}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {task.labels.map((label) => {
                  const IconComp =
                    label.icon && LABEL_ICON_MAP[label.icon as LabelIconName]
                      ? LABEL_ICON_MAP[label.icon as LabelIconName]
                      : null;
                  return (
                    <Badge
                      key={label.id}
                      variant="outline"
                      className="gap-1 text-xs font-normal"
                      style={{ borderColor: label.color, color: label.color }}
                    >
                      {IconComp && <IconComp className="size-3" />}
                      {label.name}
                    </Badge>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* Goals */}
        {task.goals.length > 0 && (
          <>
            <Separator />
            <div>
              <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-foreground">
                <Target className="size-3.5" />
                {t("fields.linkedGoals")}
              </p>
              <div className="flex flex-col gap-1">
                {task.goals.map((g) => (
                  <span key={g.id} className="text-sm text-muted-foreground">
                    {g.title}
                  </span>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Linked meeting */}
        {task.meetingTitle && (
          <>
            <Separator />
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Link2 className="size-3.5 shrink-0" />
              <span>{task.meetingTitle}</span>
            </div>
          </>
        )}

        {/* Actions */}
        <Separator />
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="cursor-pointer text-destructive border-destructive/30 hover:bg-destructive/10"
            onClick={() => {
              onOpenChange(false);
              onDelete(task.id);
            }}
          >
            <Trash2 className="size-3.5" />
            {t("deleteLabel")}
          </Button>
          <Button
            type="button"
            size="sm"
            className="cursor-pointer"
            onClick={() => {
              onOpenChange(false);
              onEdit(task);
            }}
          >
            <Pencil className="size-3.5" />
            {t("editLabel")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
