/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version canary-v1.1.8
 * @since canary-v1.1.8
 */

"use client";

import { Scale, CalendarDays, Pencil, Trash2 } from "lucide-react";
import { LABEL_ICON_MAP } from "@/components/settings/labels/label-icons";
import type { LabelIconName } from "@/components/settings/labels/label-icons";
import { useTranslations, useLocale } from "next-intl";
import { cn, formatDate } from "@/lib/core/utils";
import type { DecisionRecord } from "@/types/api";
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

const STATUS_COLORS: Record<string, string> = {
  open: "text-blue-600 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30",
  decided:
    "text-green-600 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30",
  reversed: "text-muted-foreground border-border bg-muted/40",
};

interface DecisionDetailDialogProps {
  decision: DecisionRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (decision: DecisionRecord) => void;
  onDelete: (decisionId: string) => void;
}

export function DecisionDetailDialog({
  decision,
  open,
  onOpenChange,
  onEdit,
  onDelete,
}: DecisionDetailDialogProps) {
  const t = useTranslations("decisions");
  const tCommon = useTranslations("common");
  const locale = useLocale();

  if (!decision) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle
            className={cn(
              "text-base font-semibold leading-snug pr-6",
              decision.status === "reversed" &&
                "line-through text-muted-foreground",
            )}
          >
            {decision.title}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {decision.rationale ?? decision.outcome ?? decision.title}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-1.5">
          <Badge
            variant="outline"
            className={cn(
              "text-xs font-medium",
              STATUS_COLORS[decision.status],
            )}
          >
            {t(`status.${decision.status}`)}
          </Badge>
          {decision.decidedAt && (
            <Badge variant="outline" className="text-xs text-muted-foreground">
              {t("fields.decidedAt")}: {formatDate(decision.decidedAt, locale)}
            </Badge>
          )}
        </div>

        {decision.meetingTitle && (
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <CalendarDays className="size-3.5 shrink-0" />
            <span>
              {t("fields.linkedMeeting")}: {decision.meetingTitle}
            </span>
          </div>
        )}

        {decision.rationale && (
          <>
            <Separator />
            <div>
              <p className="mb-1 text-xs font-medium text-foreground">
                {t("fields.rationale")}
              </p>
              <p className="text-sm text-muted-foreground whitespace-pre-line">
                {decision.rationale}
              </p>
            </div>
          </>
        )}

        {decision.outcome && (
          <>
            <Separator />
            <div>
              <p className="mb-1 text-xs font-medium text-foreground">
                {t("fields.outcome")}
              </p>
              <p className="text-sm text-muted-foreground whitespace-pre-line">
                {decision.outcome}
              </p>
            </div>
          </>
        )}

        {decision.labels.length > 0 && (
          <>
            <Separator />
            <div className="flex flex-wrap gap-1.5">
              {decision.labels.map((label) => {
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

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="cursor-pointer"
            aria-label={tCommon("actions.edit")}
            onClick={() => {
              onOpenChange(false);
              onEdit(decision);
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
              onDelete(decision.id);
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
