"use client";

import { Brain, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
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

  return (
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
            onSelect={() => onEdit(entry)}
          >
            <Pencil className="mr-2 size-4" />
            {t("edit")}
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer text-destructive focus:text-destructive"
            onSelect={() => onDelete(entry.id)}
          >
            <Trash2 className="mr-2 size-4" />
            {t("delete")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
