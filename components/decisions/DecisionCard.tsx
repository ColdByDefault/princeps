"use client";

import { Scale, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
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
        <Scale className="size-5" />
      </div>

      {/* Body */}
      <div className="min-w-0 flex-1 space-y-1">
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
            {formatDate(decision.decidedAt)}
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
            onClick={() => onEdit(decision)}
            className="cursor-pointer"
          >
            <Pencil className="mr-2 size-3.5" />
            {t("editLabel")}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onDelete(decision.id)}
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
