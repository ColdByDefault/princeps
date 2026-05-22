/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version canary-v1.1.4
 * @since canary-v1.1.4
 */

"use client";

import { useLocale, useTranslations } from "next-intl";
import { Target, CalendarClock } from "lucide-react";
import { cn, formatDate } from "@/lib/core/utils";
import { Badge } from "@/components/ui/badge";
import type { GoalRecord } from "@/types/api";
import type { HorizonBuckets } from "@/lib/features/goals/horizon.logic";

const STATUS_COLORS: Record<string, string> = {
  open: "text-blue-600 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30",
  in_progress:
    "text-amber-600 border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30",
  done: "text-green-600 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30",
  cancelled: "text-muted-foreground border-border bg-muted/40",
};

function GoalPill({ goal }: { goal: GoalRecord }) {
  const locale = useLocale();
  const t = useTranslations("goals");

  return (
    <div className="rounded-lg border border-border/60 bg-card px-3 py-2.5 space-y-1.5">
      <div className="flex items-start gap-2">
        <Target className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <p className="text-sm font-medium leading-snug">{goal.title}</p>
      </div>
      <div className="flex flex-wrap items-center gap-1.5 pl-5">
        <Badge
          variant="outline"
          className={cn("text-xs", STATUS_COLORS[goal.status])}
        >
          {t(`status.${goal.status}`)}
        </Badge>
        {goal.targetDate && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <CalendarClock className="h-3 w-3" />
            {formatDate(goal.targetDate, locale)}
          </span>
        )}
      </div>
    </div>
  );
}

type ColumnProps = {
  label: string;
  sublabel: string;
  goals: GoalRecord[];
  accent: string;
  emptyText: string;
};

function HorizonColumn({
  label,
  sublabel,
  goals,
  accent,
  emptyText,
}: ColumnProps) {
  return (
    <div className="flex flex-col gap-3">
      {/* Column header */}
      <div className={cn("rounded-lg border-l-4 bg-muted/40 px-4 py-3", accent)}>
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold">{label}</p>
            <p className="text-xs text-muted-foreground">{sublabel}</p>
          </div>
          <span className="rounded-full bg-background px-2 py-0.5 text-xs font-medium tabular-nums shadow-sm">
            {goals.length}
          </span>
        </div>
      </div>

      {/* Goals */}
      {goals.length === 0 ? (
        <p className="px-1 text-xs text-muted-foreground/60 italic">
          {emptyText}
        </p>
      ) : (
        <div className="space-y-2">
          {goals.map((g) => (
            <GoalPill key={g.id} goal={g} />
          ))}
        </div>
      )}
    </div>
  );
}

type Props = {
  buckets: HorizonBuckets;
};

export function HorizonView({ buckets }: Props) {
  const t = useTranslations("goals.horizon");

  const columns = [
    {
      key: "now" as const,
      label: t("now"),
      sublabel: t("nowSub"),
      accent: "border-l-red-400",
    },
    {
      key: "medium" as const,
      label: t("medium"),
      sublabel: t("mediumSub"),
      accent: "border-l-amber-400",
    },
    {
      key: "long" as const,
      label: t("long"),
      sublabel: t("longSub"),
      accent: "border-l-blue-400",
    },
    {
      key: "unplaced" as const,
      label: t("unplaced"),
      sublabel: t("unplacedSub"),
      accent: "border-l-muted-foreground/30",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
      {columns.map((col) => (
        <HorizonColumn
          key={col.key}
          label={col.label}
          sublabel={col.sublabel}
          goals={buckets[col.key]}
          accent={col.accent}
          emptyText={t("empty")}
        />
      ))}
    </div>
  );
}
