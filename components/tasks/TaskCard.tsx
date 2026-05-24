/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version canary-v1.1.7
 * @since beta
 */

"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Circle,
  Eye,
  MoreHorizontal,
  Pencil,
  Target,
  Trash2,
  CalendarDays,
  UserCheck,
} from "lucide-react";
import { LABEL_ICON_MAP } from "@/components/labels/label-icons";
import type { LabelIconName } from "@/components/labels/label-icons";
import { useTranslations, useLocale } from "next-intl";
import { cn, formatDate } from "@/lib/core/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { TaskRecord } from "@/types/api";
import {
  ViewDetailDialog,
  type DetailField,
} from "@/components/shared/ViewDetailDialog";

const PRIORITY_COLORS: Record<string, string> = {
  urgent:
    "text-red-500 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30",
  high: "text-orange-500 border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/30",
  normal:
    "text-blue-500 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30",
  low: "text-muted-foreground border-border bg-muted/40",
};

type TaskCardProps = {
  task: TaskRecord;
  isUpdating: boolean;
  isDeleting: boolean;
  onToggleDone: (task: TaskRecord) => void;
  onEdit: (task: TaskRecord) => void;
  onDelete: (taskId: string) => void;
};

export function TaskCard({
  task,
  isUpdating,
  isDeleting,
  onToggleDone,
  onEdit,
  onDelete,
}: TaskCardProps) {
  const t = useTranslations("tasks");
  const isDone = task.status === "done";

  const locale = useLocale();
  const [viewOpen, setViewOpen] = useState(false);

  const fields: DetailField[] = [
    { label: t("fields.status"), value: t(`status.${task.status}` as never) },
    { label: t("fields.priority"), value: t(`priority.${task.priority}` as never) },
    {
      label: t("fields.dueDate"),
      value: task.dueDate ? formatDate(task.dueDate, locale) : null,
      hidden: !task.dueDate,
    },
    {
      label: t("fields.notes"),
      value: <p className="whitespace-pre-wrap">{task.notes}</p>,
      hidden: !task.notes,
    },
    {
      label: t("fields.labels"),
      value: (
        <div className="flex flex-wrap gap-1">
          {task.labels.map((label) => {
            const Icon = label.icon
              ? LABEL_ICON_MAP[label.icon as LabelIconName]
              : null;
            return (
              <span
                key={label.id}
                className="inline-flex h-5 items-center gap-1 rounded-full px-2 text-[10px] font-medium text-white"
                style={{ backgroundColor: label.color }}
              >
                {Icon && <Icon className="size-3 shrink-0" />}
                {label.name}
              </span>
            );
          })}
        </div>
      ),
      hidden: !task.labels.length,
    },
    {
      label: t("fields.linkedGoals"),
      value: (
        <div className="flex flex-wrap gap-1">
          {task.goals.map((goal) => (
            <span
              key={goal.id}
              className="inline-flex h-5 items-center gap-1 rounded-full border border-border/60 bg-muted/40 px-2 text-[10px] font-medium text-muted-foreground"
            >
              <Target className="size-2.5 shrink-0" />
              {goal.title}
            </span>
          ))}
        </div>
      ),
      hidden: !task.goals.length,
    },
    {
      label: t("viewDialog.meeting"),
      value: task.meetingTitle,
      hidden: !task.meetingTitle,
    },
    {
      label: t("fields.delegatedTo"),
      value: task.delegatedTo,
      hidden: !task.delegatedTo,
    },
    {
      label: t("fields.delegateNotes"),
      value: <p className="whitespace-pre-wrap">{task.delegateNotes}</p>,
      hidden: !task.delegateNotes,
    },
    {
      label: t("viewDialog.createdAt"),
      value: formatDate(task.createdAt, locale),
    },
  ];

  return (
    <>
      <div
        className={cn(
          "flex items-start gap-3 rounded-xl border border-border/60 bg-card px-4 py-3 transition-opacity",
          (isUpdating || isDeleting) && "opacity-60 pointer-events-none",
        )}
      >
        {/* Done toggle */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={isDone ? t("reopenLabel") : t("markDoneLabel")}
                  className="mt-0.5 size-7 cursor-pointer shrink-0 text-muted-foreground hover:text-primary"
                  onClick={() => onToggleDone(task)}
                />
              }
            >
              {isDone ? (
                <CheckCircle2 className="size-5 text-green-500" />
              ) : (
                <Circle className="size-5" />
              )}
            </TooltipTrigger>
            <TooltipContent>
              {isDone ? t("reopenLabel") : t("markDoneLabel")}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "text-sm font-medium leading-snug",
              isDone && "line-through text-muted-foreground",
            )}
          >
            {task.title}
          </p>
          {task.notes && (
            <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
              {task.notes}
            </p>
          )}
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <Badge
              variant="outline"
              className={cn(
                "h-5 px-1.5 text-[10px] font-medium",
                PRIORITY_COLORS[task.priority] ?? PRIORITY_COLORS.normal,
              )}
            >
              {t(`priority.${task.priority}` as never)}
            </Badge>
            {task.dueDate && (
              <span className="text-[10px] text-muted-foreground">
                {formatDate(task.dueDate, locale)}
              </span>
            )}
            {task.labels.slice(0, 3).map((label) => {
              const Icon = label.icon
                ? LABEL_ICON_MAP[label.icon as LabelIconName]
                : null;
              return (
                <span
                  key={label.id}
                  className="inline-flex h-5 items-center gap-1 rounded-full px-2 text-[10px] font-medium text-white"
                  style={{ backgroundColor: label.color }}
                >
                  {Icon && <Icon className="size-3 shrink-0" />}
                  {label.name}
                </span>
              );
            })}
            {task.labels.length > 3 && (
              <span className="inline-flex h-5 items-center rounded-full border border-border px-2 text-[10px] font-medium text-muted-foreground">
                +{task.labels.length - 3}
              </span>
            )}
            {task.goals.map((goal) => (
              <span
                key={goal.id}
                className="inline-flex h-5 items-center gap-1 rounded-full border border-border/60 bg-muted/40 px-2 text-[10px] font-medium text-muted-foreground"
              >
                <Target className="size-2.5 shrink-0" />
                {goal.title}
              </span>
            ))}
            {task.meetingTitle && (
              <span className="inline-flex h-5 items-center gap-1 rounded-full border border-border/60 bg-muted/40 px-2 text-[10px] font-medium text-muted-foreground">
                <CalendarDays className="size-2.5 shrink-0" />
                {task.meetingTitle}
              </span>
            )}
            {task.delegatedTo && (
              <span className="inline-flex h-5 items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 dark:border-indigo-800 dark:bg-indigo-950/30 px-2 text-[10px] font-medium text-indigo-600 dark:text-indigo-400">
                <UserCheck className="size-2.5 shrink-0" />
                {task.delegatedTo}
              </span>
            )}
          </div>
        </div>

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
                    aria-label={t("viewLabel")}
                    className="size-7 cursor-pointer shrink-0 text-muted-foreground"
                    onClick={() => setViewOpen(true)}
                  />
                }
              >
                <Eye className="size-3.5" />
              </TooltipTrigger>
              <TooltipContent>{t("viewLabel")}</TooltipContent>
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
                  title={t("actionsLabel")}
                  className="size-7 cursor-pointer shrink-0 text-muted-foreground"
                />
              }
            >
              <MoreHorizontal className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => onEdit(task)}
              >
                <Pencil className="mr-2 size-3.5" />
                {t("editLabel")}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer text-destructive focus:text-destructive"
                onClick={() => onDelete(task.id)}
              >
                <Trash2 className="mr-2 size-3.5" />
                {t("deleteLabel")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <ViewDetailDialog
        open={viewOpen}
        onOpenChange={setViewOpen}
        title={task.title}
        fields={fields}
      />
    </>
  );
}
