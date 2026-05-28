/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version canary-v1.1.8
 * @since canary-v1.1.8
 */

"use client";

import { Brain, Pencil, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/core/utils";
import type { MemoryEntryRecord } from "@/types/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DetailDialogShell } from "@/components/shared/DetailDialogShell";
import { Separator } from "@/components/ui/separator";

interface MemoryEntryDetailDialogProps {
  entry: MemoryEntryRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (entry: MemoryEntryRecord) => void;
  onDelete: (id: string) => void;
}

export function MemoryEntryDetailDialog({
  entry,
  open,
  onOpenChange,
  onEdit,
  onDelete,
}: MemoryEntryDetailDialogProps) {
  const t = useTranslations("memory");
  const tCommon = useTranslations("common");

  if (!entry) return null;

  return (
    <DetailDialogShell
      open={open}
      onOpenChange={onOpenChange}
      title={entry.key}
      titleClassName="text-base font-semibold leading-snug pr-6"
      description={entry.value}
      descriptionClassName="sr-only"
    >
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Brain className="size-4 shrink-0" />
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

      <Separator />

      <p className="text-sm leading-relaxed whitespace-pre-line text-foreground">
        {entry.value}
      </p>

      <Separator />

      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          className="cursor-pointer"
          aria-label={tCommon("actions.edit")}
          onClick={() => {
            onOpenChange(false);
            onEdit(entry);
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
            onDelete(entry.id);
          }}
        >
          <Trash2 className="mr-1.5 size-3.5" />
          {tCommon("actions.delete")}
        </Button>
      </div>
    </DetailDialogShell>
  );
}
