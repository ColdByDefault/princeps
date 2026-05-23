/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version canary-v1.1.6
 * @since beta
 */

"use client";

import { FileText, Tag, HardDrive } from "lucide-react";
import { LABEL_ICON_MAP } from "@/components/labels/label-icons";
import type { LabelIconName } from "@/components/labels/label-icons";
import { useTranslations, useLocale } from "next-intl";
import { formatDate } from "@/lib/core/utils";
import { Badge } from "@/components/ui/badge";
import { ItemCard } from "@/components/shared/ItemCard";
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

  return (
    <ItemCard
      isDisabled={deleting}
      className="p-4 hover:bg-accent/30"
      leading={
        <div className="mt-0.5 shrink-0 rounded-lg bg-primary/10 p-2">
          <FileText className="size-4 text-primary" aria-hidden="true" />
        </div>
      }
      {...(document.sourceType !== "drive" && {
        onDelete: () => onDelete(document.id),
        deleteLabel: t("deleteTooltip"),
        deleteTitle: t("deleteDialog.title"),
        deleteDescription: t("deleteDialog.description", {
          name: document.name,
        }),
        deleteCancelLabel: t("deleteDialog.cancel"),
        deleteConfirmLabel: t("deleteDialog.confirm"),
        actionsAriaLabel: t("deleteAriaLabel", { name: document.name }),
      })}
    >
      <div className="space-y-1">
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

        {document.sourceType === "drive" && (
          <div className="pt-1">
            <Badge
              variant="outline"
              className="h-5 gap-1 px-1.5 text-xs text-muted-foreground"
            >
              <HardDrive className="size-3 shrink-0" aria-hidden="true" />
              {t("sourceDrive")}
            </Badge>
          </div>
        )}

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
    </ItemCard>
  );
}
