/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version canary-v1.1.7
 * @since canary-v1.0.2
 */

"use client";

import { Scale, CalendarDays } from "lucide-react";
import { LABEL_ICON_MAP } from "@/components/labels/label-icons";
import type { LabelIconName } from "@/components/labels/label-icons";
import { useTranslations, useLocale } from "next-intl";
import { cn, formatDate } from "@/lib/core/utils";
import { Badge } from "@/components/ui/badge";
import { ItemCard } from "@/components/shared/ItemCard";
import type { DecisionRecord } from "@/types/api";

const STATUS_COLORS: Record<string, string> = {
  open: "text-blue-600 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30",
  decided:
    "text-green-600 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30",
  reversed: "text-muted-foreground border-border bg-muted/40",
};

type DecisionCardProps = {
  decision: DecisionRecord;
  isUpdating: boolean;
  isDeleting: boolean;
  onEdit: (decision: DecisionRecord) => void;
  onDelete: (decisionId: string) => void;
};

export function DecisionCard({
  decision,
  isUpdating,
  isDeleting,
  onEdit,
  onDelete,
}: DecisionCardProps) {
  const t = useTranslations("decisions");
const tCommon = useTranslations("common");
  const locale = useLocale();

  return (
    <ItemCard
      isDisabled={isUpdating || isDeleting}
      leading={
        <div className="mt-0.5 shrink-0 text-muted-foreground">
          <Scale className="size-5" />
        </div>
      }
      onEdit={() => onEdit(decision)}
      editLabel={tCommon("actions.edit")}
      onDelete={() => onDelete(decision.id)}
      deleteLabel={tCommon("actions.delete")}
      deleteTitle={t("deleteDialog.title")}
      deleteDescription={tCommon("confirmation.cannotUndo")}
      deleteCancelLabel={tCommon("actions.cancel")}
      deleteConfirmLabel={tCommon("actions.delete")}
      actionsAriaLabel={t("actionsLabel")}
    >
      <div className="space-y-1">
        <p
          className={cn(
            "text-sm font-medium leading-snug",
            decision.status === "reversed" &&
              "line-through text-muted-foreground",
          )}
        >
          {decision.title}
        </p>

        {decision.rationale && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {decision.rationale}
          </p>
        )}

        {decision.outcome && (
          <p className="text-xs text-foreground/70 line-clamp-2 leading-relaxed font-medium">
            → {decision.outcome}
          </p>
        )}

        {/* Meta row */}
        {decision.decidedAt && (
          <p className="text-[10px] text-muted-foreground">
            {formatDate(decision.decidedAt, locale)}
          </p>
        )}

        {/* Status + labels */}
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          <Badge
            variant="outline"
            className={cn(
              "text-xs font-medium",
              STATUS_COLORS[decision.status],
            )}
          >
            {t(`status.${decision.status}`)}
          </Badge>
          {decision.meetingTitle && (
            <span className="inline-flex h-5 items-center gap-1 rounded-full border border-border/60 bg-muted/40 px-2 text-[10px] font-medium text-muted-foreground">
              <CalendarDays className="size-2.5 shrink-0" />
              {decision.meetingTitle}
            </span>
          )}
          {decision.labels.slice(0, 3).map((lbl) => {
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
          {decision.labels.length > 3 && (
            <Badge variant="outline" className="text-xs text-muted-foreground">
              +{decision.labels.length - 3}
            </Badge>
          )}
        </div>
      </div>
    </ItemCard>
  );
}
