/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version canary-v1.1.8
 * @since canary-v1.0.2
 */

"use client";

import {
  Target,
  CheckCircle2,
  Circle,
  ListChecks,
  Users,
  Flame,
  Minus,
  Snowflake,
} from "lucide-react";
import { LABEL_ICON_MAP } from "@/components/settings/labels/label-icons";
import type { LabelIconName } from "@/components/settings/labels/label-icons";
import { useTranslations, useLocale } from "next-intl";
import { cn, formatDate } from "@/lib/core/utils";
import { Badge } from "@/components/ui/badge";
import { ItemCard } from "@/components/shared/ItemCard";
import { CardIconButton } from "@/components/shared/CardIconButton";
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
  milestonePending: string | null;
  onEdit: (goal: GoalRecord) => void;
  onDelete: (goalId: string) => void;
  onToggleMilestone: (
    goalId: string,
    milestoneId: string,
    completed: boolean,
  ) => Promise<boolean>;
  onOpenStakeholders: (goal: GoalRecord) => void;
};

export function GoalCard({
  goal,
  isUpdating,
  isDeleting,
  milestonePending,
  onEdit,
  onDelete,
  onToggleMilestone,
  onOpenStakeholders,
}: GoalCardProps) {
  const t = useTranslations("goals");
const tCommon = useTranslations("common");

  const totalMilestones = goal.milestones.length;
  const doneMilestones = goal.milestones.filter((m) => m.completed).length;
  const progressPct =
    totalMilestones > 0
      ? Math.round((doneMilestones / totalMilestones) * 100)
      : null;

  const locale = useLocale();

  return (
    <ItemCard
      isDisabled={isUpdating || isDeleting}
      leading={
        <div className="mt-0.5 shrink-0 text-muted-foreground">
          <Target className="size-5" />
        </div>
      }
      inlineActions={
        <CardIconButton
          icon={<Users className="size-3.5" />}
          label={t("stakeholders.openLabel")}
          onClick={() => onOpenStakeholders(goal)}
        />
      }
      onEdit={() => onEdit(goal)}
      editLabel={tCommon("actions.edit")}
      onDelete={() => onDelete(goal.id)}
      deleteLabel={tCommon("actions.delete")}
      deleteTitle={t("deleteDialog.heading")}
      deleteDescription={t("deleteDialog.body")}
      deleteCancelLabel={tCommon("actions.cancel")}
      deleteConfirmLabel={tCommon("actions.delete")}
      actionsAriaLabel={t("actionsLabel")}
    >
      <div className="space-y-1.5">
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

        {/* Milestones — inline toggle */}
        {goal.milestones.length > 0 && (
          <div className="space-y-0.5 pt-0.5">
            <div className="flex items-center gap-1 pb-0.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
              {doneMilestones}/{totalMilestones} {t("milestoneProgress")}
            </div>
            <div className="h-1 w-full overflow-hidden rounded-full bg-muted mb-1.5">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${progressPct ?? 0}%` }}
              />
            </div>
            {goal.milestones.map((m) => {
              const isPending = milestonePending === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  disabled={isPending || isUpdating || isDeleting}
                  onClick={() => onToggleMilestone(goal.id, m.id, !m.completed)}
                  aria-label={`${m.completed ? t("milestoneUnmark") : t("milestoneMark")}: ${m.title}`}
                  className={cn(
                    "flex w-full items-center gap-1.5 rounded-md px-1 py-0.5 text-left text-xs transition-opacity hover:bg-muted/60 cursor-pointer",
                    isPending && "opacity-50",
                    m.completed && "text-muted-foreground",
                  )}
                >
                  {m.completed ? (
                    <CheckCircle2 className="size-3.5 shrink-0 text-green-500" />
                  ) : (
                    <Circle className="size-3.5 shrink-0 text-muted-foreground" />
                  )}
                  <span className={cn(m.completed && "line-through")}>
                    {m.title}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Meta: target date */}
        <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
          {goal.targetDate && (
            <span>
              {t("targetDate")}: {formatDate(goal.targetDate, locale)}
            </span>
          )}
        </div>

        {/* Linked tasks */}
        {goal.tasks.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {goal.tasks.slice(0, 3).map((task) => (
              <span
                key={task.id}
                className="inline-flex h-5 items-center gap-1 rounded-full border border-border/60 bg-muted/40 px-2 text-[10px] font-medium text-muted-foreground"
              >
                <ListChecks className="size-2.5 shrink-0" />
                {task.title}
              </span>
            ))}
            {goal.tasks.length > 3 && (
              <span className="inline-flex h-5 items-center rounded-full border border-border px-2 text-[10px] font-medium text-muted-foreground">
                +{goal.tasks.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Stakeholder summary — clickable row */}
        {goal.stakeholders.length > 0 && (
          <button
            type="button"
            onClick={() => onOpenStakeholders(goal)}
            aria-label={t("stakeholders.openLabel")}
            className="flex flex-wrap items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity text-left"
          >
            {goal.stakeholders.slice(0, 4).map((s) => {
              const health = s.health as "warm" | "neutral" | "cold";
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
                  key={s.id}
                  className={cn(
                    "inline-flex h-5 items-center gap-1 rounded-full border px-2 text-[10px] font-medium",
                    colorClass,
                  )}
                >
                  <Icon className="size-2.5 shrink-0" />
                  {s.contactName}
                </span>
              );
            })}
            {goal.stakeholders.length > 4 && (
              <span className="inline-flex h-5 items-center rounded-full border border-border px-2 text-[10px] font-medium text-muted-foreground">
                +{goal.stakeholders.length - 4}
              </span>
            )}
          </button>
        )}

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
    </ItemCard>
  );
}


