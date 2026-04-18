/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version beta
 * @since beta
 * @module
 * @description
 */

"use client";

import { useState } from "react";
import { FileText, Trash2, Tag } from "lucide-react";
import { LABEL_ICON_MAP } from "@/components/labels/label-icons";
import type { LabelIconName } from "@/components/labels/label-icons";
import { useTranslations, useLocale } from "next-intl";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { KnowledgeDocumentRecord } from "@/types/api";

type DocumentCardProps = {
  document: KnowledgeDocumentRecord;
  deleting: boolean;
  onDelete: (id: string) => void;
};

function formatChars(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M chars`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k chars`;
  return `${n} chars`;
}

function formatApproxTokens(chars: number): string {
  const tokens = Math.ceil(chars / 4);
  if (tokens >= 1_000) return `~${(tokens / 1_000).toFixed(0)}k tokens`;
  return `~${tokens} tokens`;
}

export function DocumentCard({
  document,
  deleting,
  onDelete,
}: DocumentCardProps) {
  const t = useTranslations("knowledge");
  const locale = useLocale();
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-card p-4 transition-colors hover:bg-accent/30">
      {/* Icon */}
      <div className="mt-0.5 shrink-0 rounded-lg bg-primary/10 p-2">
        <FileText className="size-4 text-primary" aria-hidden="true" />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1 space-y-1">
        <p className="truncate text-sm font-medium" title={document.name}>
          {document.name}
        </p>

        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span>{formatChars(document.charCount)}</span>
          <span>·</span>
          <span>{formatApproxTokens(document.charCount)}</span>
          <span>·</span>
          <span>{formatDate(document.createdAt, locale)}</span>
        </div>

        {document.labels.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            <Tag
              className="size-3 shrink-0 self-center text-muted-foreground"
              aria-hidden="true"
            />
            {document.labels.map((label) => {
              const Icon = label.icon
                ? LABEL_ICON_MAP[label.icon as LabelIconName]
                : null;
              return (
                <Badge
                  key={label.id}
                  variant="outline"
                  className="h-5 px-1.5 text-xs gap-1"
                  style={{ borderColor: label.color, color: label.color }}
                >
                  {Icon && <Icon className="size-3 shrink-0" />}
                  {label.name}
                </Badge>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete action */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 cursor-pointer text-muted-foreground hover:text-destructive"
                  disabled={deleting}
                  aria-label={t("deleteAriaLabel", { name: document.name })}
                  onClick={() => setConfirmOpen(true)}
                />
              }
            >
              <Trash2 className="size-4" aria-hidden="true" />
            </TooltipTrigger>
            <TooltipContent>{t("deleteTooltip")}</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteDialog.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteDialog.description", { name: document.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">
              {t("deleteDialog.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              className="cursor-pointer"
              onClick={() => onDelete(document.id)}
            >
              {t("deleteDialog.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
