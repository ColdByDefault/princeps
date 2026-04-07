"use client";

import {
  Target,
  MoreHorizontal,
  Pencil,
  Trash2,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { LABEL_ICON_MAP } from "@/components/labels/label-icons";
import type { LabelIconName } from "@/components/labels/label-icons";
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
import type { GoalRecord } from "@/types/api";

const STATUS_COLORS: Record<string, string> = {
  open: "text-blue-600 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30",
  in_progress:
    "text-amber-600 border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30",
  done: "text-green-600 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30",
  cancelled: "text-muted-foreground border-border bg-muted/40",
};

type GoalCardProps = {
  goal: GoalRecord;
  isUpdating: boolean;
  isDeleting: boolean;
  onEdit: (goal: GoalRecord) => void;
  onDelete: (goalId: string) => void;
};

export function GoalCard({
  goal,
  isUpdating,
  isDeleting,
  onEdit,
  onDelete,
}: GoalCardProps) {
  const t = useTranslations("goals");

  const totalMilestones = goal.milestones.length;
  const doneMilestones = goal.milestones.filter((m) => m.completed).length;
  const progressPct =
    totalMilestones > 0
      ? Math.round((doneMilestones / totalMilestones) * 100)
      : null;

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
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
        <Target className="size-5" />
      </div>

      {/* Body */}
      <div className="min-w-0 flex-1 space-y-1.5">
        <p
          className={cn(
            "text-sm font-medium leading-snug",
            goal.status === "cancelled" && "line-through text-muted-foreground",
          )}
        >
          {goal.title}
        </p>

        {goal.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {goal.description}
          </p>
        )}

        {/* Milestone progress */}
        {progressPct !== null && (
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              {doneMilestones === totalMilestones ? (
                <CheckCircle2 className="size-3 text-green-500" />
              ) : (
                <Circle className="size-3" />
              )}
              {doneMilestones}/{totalMilestones} {t("milestoneProgress")}
            </div>
            <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}

        {/* Meta: target date + linked tasks */}
        <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
          {goal.targetDate && (
            <span>
              {t("targetDate")}: {formatDate(goal.targetDate)}
            </span>
          )}
          {goal.tasks.length > 0 && (
            <span>
              {goal.tasks.length} {t("linkedTasks")}
            </span>
          )}
        </div>

        {/* Status + labels */}
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          <Badge
            variant="outline"
            className={cn("text-xs font-medium", STATUS_COLORS[goal.status])}
          >
            {t(`status.${goal.status}`)}
          </Badge>
          {goal.labels.slice(0, 3).map((lbl) => {
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
          {goal.labels.length > 3 && (
            <Badge variant="outline" className="text-xs text-muted-foreground">
              +{goal.labels.length - 3}
            </Badge>
          )}
        </div>
      </div>

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
            onClick={() => onEdit(goal)}
            className="cursor-pointer"
          >
            <Pencil className="mr-2 size-3.5" />
            {t("editLabel")}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onDelete(goal.id)}
            className="cursor-pointer text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 size-3.5" />
            {t("deleteLabel")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
