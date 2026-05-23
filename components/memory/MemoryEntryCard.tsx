/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version canary-v1.0.7
 * @since canary-v1.0.2
 */

"use client";

import { useState } from "react";
import { Brain, Eye, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
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
import {
  ViewDetailDialog,
  type DetailField,
} from "@/components/shared/ViewDetailDialog";
import type { MemoryEntryRecord } from "@/types/api";

type MemoryEntryCardProps = {
  entry: MemoryEntryRecord;
  isUpdating: boolean;
  isDeleting: boolean;
  onEdit: (entry: MemoryEntryRecord) => void;
  onDelete: (id: string) => void;
};

export function MemoryEntryCard({
  entry,
  isUpdating,
  isDeleting,
  onEdit,
  onDelete,
}: MemoryEntryCardProps) {
  const t = useTranslations("memory");
  const locale = useLocale();
  const [viewOpen, setViewOpen] = useState(false);

  const fields: DetailField[] = [
    { label: t("viewDialog.topic"), value: entry.key },
    {
      label: t("viewDialog.fact"),
      value: <p className="whitespace-pre-wrap">{entry.value}</p>,
    },
    {
      label: t("viewDialog.source"),
      value: entry.source === "llm" ? t("sourceAI") : t("sourceUser"),
    },
    {
      label: t("viewDialog.createdAt"),
      value: formatDate(entry.createdAt, locale),
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
        {/* Icon */}
        <div className="mt-0.5 shrink-0 text-muted-foreground">
          <Brain className="size-5" />
        </div>

        {/* Body */}
        <div className="min-w-0 flex-1 space-y-0.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {entry.key}
          </p>
          <p className="text-sm leading-relaxed">{entry.value}</p>
          <div className="flex items-center gap-2 pt-1">
            <Badge
              variant="outline"
              className={cn(
                "text-xs",
                entry.source === "llm"
                  ? "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-800 dark:bg-violet-950/30 dark:text-violet-400"
                  : "border-border text-muted-foreground",
              )}
            >
              {entry.source === "llm" ? t("sourceAI") : t("sourceUser")}
            </Badge>
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
                    className="cursor-pointer shrink-0 size-8 text-muted-foreground"
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
                  className="cursor-pointer shrink-0 size-8 text-muted-foreground"
                  aria-label={t("actions")}
                />
              }
            >
              <MoreHorizontal className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => onEdit(entry)}
              >
                <Pencil className="mr-2 size-4" />
                {t("edit")}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer text-destructive focus:text-destructive"
                onClick={() => onDelete(entry.id)}
              >
                <Trash2 className="mr-2 size-4" />
                {t("delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <ViewDetailDialog
        open={viewOpen}
        onOpenChange={setViewOpen}
        title={entry.key}
        fields={fields}
      />
    </>
  );
}
