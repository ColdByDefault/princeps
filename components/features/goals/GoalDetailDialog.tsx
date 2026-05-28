/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version canary-v1.1.8
 * @since canary-v1.1.8
 */

"use client";

import {
  CheckCircle2,
  Circle,
  ListChecks,
  Users,
  Flame,
  Minus,
  Snowflake,
  Pencil,
  Trash2,
} from "lucide-react";
import { LABEL_ICON_MAP } from "@/components/settings/labels/label-icons";
import type { LabelIconName } from "@/components/settings/labels/label-icons";
import { useTranslations, useLocale } from "next-intl";
import { cn, formatDate } from "@/lib/core/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { GoalRecord } from "@/types/api";

const STATUS_COLORS: Record<string, string> = {
  open: "text-blue-600 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30",
  in_progress:
    "text-amber-600 border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30",
  done: "text-green-600 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30",
  cancelled: "text-muted-foreground border-border bg-muted/40",
};

interface GoalDetailDialogProps {
  goal: GoalRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (goal: GoalRecord) => void;
  onDelete: (goalId: string) => void;
  onOpenStakeholders: (goal: GoalRecord) => void;
}

export function GoalDetailDialog({
  goal,
  open,
  onOpenChange,
  onEdit,
  onDelete,
  onOpenStakeholders,
}: GoalDetailDialogProps) {
  const t = useTranslations("goals");
  const tCommon = useTranslations("common");
  const locale = useLocale();

  if (!goal) return null;

  const totalMilestones = goal.milestones.length;
  const doneMilestones = goal.milestones.filter((m) => m.completed).length;
  const progressPct =
    totalMilestones > 0
      ? Math.round((doneMilestones / totalMilestones) * 100)
      : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle
            className={cn(
              "text-base font-semibold leading-snug pr-6",
              goal.status === "cancelled" &&
                "line-through text-muted-foreground",
            )}
          >
            {goal.title}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {goal.description ?? goal.title}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-1.5">
          <Badge
            variant="outline"
            className={cn("text-xs font-medium", STATUS_COLORS[goal.status])}
          >
            {t(`status.${goal.status}`)}
          </Badge>
          {goal.targetDate && (
            <Badge variant="outline" className="text-xs text-muted-foreground">
              {t("targetDate")}: {formatDate(goal.targetDate, locale)}
            </Badge>
          )}
        </div>

        {goal.description && (
          <p className="text-sm text-muted-foreground whitespace-pre-line">
            {goal.description}
          </p>
        )}

        {goal.milestones.length > 0 && (
          <>
            <Separator />
            <div>
              <p className="mb-1 text-xs font-medium text-foreground">
                {t("fields.milestones")}
              </p>
              <div className="mb-2 h-1 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${progressPct ?? 0}%` }}
                />
              </div>
              <div className="space-y-1">
                {goal.milestones.map((milestone) => (
                  <div
                    key={milestone.id}
                    className="flex items-center gap-1.5 text-sm text-muted-foreground"
                  >
                    {milestone.completed ? (
                      <CheckCircle2 className="size-3.5 shrink-0 text-green-500" />
                    ) : (
                      <Circle className="size-3.5 shrink-0" />
                    )}
                    <span className={cn(milestone.completed && "line-through")}>
                      {milestone.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {goal.tasks.length > 0 && (
          <>
            <Separator />
            <div>
              <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-foreground">
                <ListChecks className="size-3.5" />
                {t("fields.linkedTasks")}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {goal.tasks.map((task) => (
                  <Badge key={task.id} variant="outline" className="text-xs">
                    {task.title}
                  </Badge>
                ))}
              </div>
            </div>
          </>
        )}

        {goal.stakeholders.length > 0 && (
          <>
            <Separator />
            <div>
              <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-foreground">
                <Users className="size-3.5" />
                {t("stakeholders.menuLabel")}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {goal.stakeholders.map((stakeholder) => {
                  const health = stakeholder.health as
                    | "warm"
                    | "neutral"
                    | "cold";
                  const Icon =
                    health === "warm"
                      ? Flame
                      : health === "cold"
                        ? Snowflake
                        : Minus;
                  const colorClass =
                    health === "warm"
                      ? "text-green-600 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30"
                      : health === "cold"
                        ? "text-blue-600 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30"
                        : "text-amber-600 border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30";

                  return (
                    <span
                      key={stakeholder.id}
                      className={cn(
                        "inline-flex h-5 items-center gap-1 rounded-full border px-2 text-[10px] font-medium",
                        colorClass,
                      )}
                    >
                      <Icon className="size-2.5 shrink-0" />
                      {stakeholder.contactName}
                    </span>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {goal.labels.length > 0 && (
          <>
            <Separator />
            <div className="flex flex-wrap gap-1.5">
              {goal.labels.map((label) => {
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
            aria-label={t("stakeholders.openLabel")}
            onClick={() => {
              onOpenChange(false);
              onOpenStakeholders(goal);
            }}
          >
            <Users className="mr-1.5 size-3.5" />
            {t("stakeholders.menuLabel")}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="cursor-pointer"
            aria-label={tCommon("actions.edit")}
            onClick={() => {
              onOpenChange(false);
              onEdit(goal);
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
              onDelete(goal.id);
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
