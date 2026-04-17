/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * SPDX-License-Identifier: Elastic-2.0
 */

"use client";

import { BookOpen } from "lucide-react";
import { useTranslations } from "next-intl";
import { DocumentCard } from "./DocumentCard";
import type { KnowledgeDocumentRecord } from "@/types/api";

type DocumentListProps = {
  documents: KnowledgeDocumentRecord[];
  deletingId: string | null;
  onDelete: (id: string) => void;
};

export function DocumentList({
  documents,
  deletingId,
  onDelete,
}: DocumentListProps) {
  const t = useTranslations("knowledge");

  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border/60 py-12 text-center">
        <div className="rounded-full bg-muted p-3">
          <BookOpen
            className="size-5 text-muted-foreground"
            aria-hidden="true"
          />
        </div>
        <p className="text-sm font-medium">{t("emptyTitle")}</p>
        <p className="max-w-xs text-xs text-muted-foreground">
          {t("emptyDescription")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {documents.map((doc) => (
        <DocumentCard
          key={doc.id}
          document={doc}
          deleting={deletingId === doc.id}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
