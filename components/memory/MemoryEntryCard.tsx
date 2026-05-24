/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version canary-v1.1.6
 * @since canary-v1.0.2
 */

"use client";

import { Brain } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/core/utils";
import { Badge } from "@/components/ui/badge";
import { ItemCard } from "@/components/shared/ItemCard";
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
const tCommon = useTranslations("common");

  return (
    <ItemCard
      isDisabled={isUpdating || isDeleting}
      leading={
        <div className="mt-0.5 shrink-0 text-muted-foreground">
          <Brain className="size-5" />
        </div>
      }
      onEdit={() => onEdit(entry)}
      editLabel={t("edit")}
      onDelete={() => onDelete(entry.id)}
      deleteLabel={tCommon("actions.delete")}
      deleteTitle={t("deleteDialog.title")}
      deleteDescription={t("deleteDialog.description")}
      deleteCancelLabel={tCommon("actions.cancel")}
      deleteConfirmLabel={tCommon("actions.delete")}
      actionsAriaLabel={t("actions")}
    >
      <div className="space-y-0.5">
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
    </ItemCard>
  );
}
