/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version canary-v1.2.1
 * @since beta
 */

"use client";

import {
  CalendarDays,
  Target,
  UserCheck,
  Pencil,
  Trash2,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { LABEL_ICON_MAP } from "@/components/settings/labels/label-icons";
import type { LabelIconName } from "@/components/settings/labels/label-icons";
import { useTranslations, useLocale } from "next-intl";
import { cn, formatDate } from "@/lib/core/utils";
import type { TaskRecord } from "@/types/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const PRIORITY_COLORS: Record<string, string> = {
  urgent:
    "text-red-500 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30",
  high: "text-orange-500 border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/30",
  normal:
    "text-blue-500 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30",
  low: "text-muted-foreground border-border bg-muted/40",
};

const STATUS_COLORS: Record<string, string> = {
  open: "text-blue-600 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30",
  in_progress:
    "text-amber-600 border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30",
  done: "text-green-600 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30",
  cancelled: "text-muted-foreground border-border bg-muted/40",
};

interface TaskDetailDialogProps {
  task: TaskRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onToggleDone: (task: TaskRecord) => void;
  onEdit: (task: TaskRecord) => void;
  onDelete: (taskId: string) => void;
}

export function TaskDetailDialog({
  task,
  open,
  onOpenChange,
  onToggleDone,
  onEdit,
  onDelete,
}: TaskDetailDialogProps) {
  const t = useTranslations("tasks");
  const tCommon = useTranslations("common");
  const locale = useLocale();

  if (!task) return null;

  const isDone = task.status === "done";
  const statusLabel =
    task.status === "open"
      ? tCommon("status.open")
      : task.status === "in_progress"
        ? t("status.inProgress")
        : task.status === "done"
          ? tCommon("status.done")
          : tCommon("status.cancelled");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
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
            {task.notes ?? task.title}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-1.5">
          <Badge
            variant="outline"
            className={cn("text-xs font-medium", STATUS_COLORS[task.status])}
          >
            {statusLabel}
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

        {(task.dueDate || task.meetingTitle || task.delegatedTo) && (
          <div className="space-y-1.5 text-sm text-muted-foreground">
            {task.dueDate && (
              <div className="flex items-center gap-2">
                <CalendarDays className="size-3.5 shrink-0" />
                <span>
                  {t("fields.dueDate")}: {formatDate(task.dueDate, locale)}
                </span>
              </div>
            )}
            {task.meetingTitle && (
              <div className="flex items-center gap-2">
                <CalendarDays className="size-3.5 shrink-0" />
                <span>
                  {tCommon("entities.meetings")}: {task.meetingTitle}
                </span>
              </div>
            )}
            {task.delegatedTo && (
              <div className="flex items-center gap-2">
                <UserCheck className="size-3.5 shrink-0" />
                <span>
                  {t("fields.delegatedTo")}: {task.delegatedTo}
                </span>
              </div>
            )}
          </div>
        )}

        {task.notes && (
          <>
            <Separator />
            <div>
              <p className="mb-1 text-xs font-medium text-foreground">
                {t("fields.notes")}
              </p>
              <p className="text-sm text-muted-foreground whitespace-pre-line">
                {task.notes}
              </p>
            </div>
          </>
        )}

        {task.delegateNotes && (
          <>
            <Separator />
            <div>
              <p className="mb-1 text-xs font-medium text-foreground">
                {t("fields.delegateNotes")}
              </p>
              <p className="text-sm text-muted-foreground whitespace-pre-line">
                {task.delegateNotes}
              </p>
            </div>
          </>
        )}

        {task.goals.length > 0 && (
          <>
            <Separator />
            <div>
              <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-foreground">
                <Target className="size-3.5" />
                {t("fields.linkedGoals")}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {task.goals.map((goal) => (
                  <Badge key={goal.id} variant="outline" className="text-xs">
                    {goal.title}
                  </Badge>
                ))}
              </div>
            </div>
          </>
        )}

        {task.labels.length > 0 && (
          <>
            <Separator />
            <div className="flex flex-wrap gap-1.5">
              {task.labels.map((label) => {
                const Icon = label.icon
                  ? LABEL_ICON_MAP[label.icon as LabelIconName]
                  : null;

                return (
                  <Badge
                    key={label.id}
                    variant="outline"
                    className="border-transparent text-white text-xs gap-1"
                    style={{ backgroundColor: label.color }}
                  >
                    {Icon && <Icon className="size-3 shrink-0" />}
                    {label.name}
                  </Badge>
                );
              })}
            </div>
          </>
        )}

        <Separator />

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="cursor-pointer"
            aria-label={isDone ? t("reopenLabel") : t("markDoneLabel")}
            onClick={() => {
              onOpenChange(false);
              onToggleDone(task);
            }}
          >
            {isDone ? (
              <Circle className="mr-1.5 size-3.5" />
            ) : (
              <CheckCircle2 className="mr-1.5 size-3.5" />
            )}
            {isDone ? t("reopenLabel") : t("markDoneLabel")}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="cursor-pointer"
            aria-label={tCommon("actions.edit")}
            onClick={() => {
              onOpenChange(false);
              onEdit(task);
            }}
          >
            <Pencil className="mr-1.5 size-3.5" />
            {tCommon("actions.edit")}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="cursor-pointer text-muted-foreground hover:text-destructive ml-auto"
            aria-label={tCommon("actions.delete")}
            onClick={() => {
              onOpenChange(false);
              onDelete(task.id);
            }}
          >
            <Trash2 className="mr-1.5 size-3.5" />
            {tCommon("actions.delete")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
