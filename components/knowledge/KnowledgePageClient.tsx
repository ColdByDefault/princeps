/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * SPDX-License-Identifier: Elastic-2.0
 */

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { UploadForm } from "./UploadForm";
import { DocumentList } from "./DocumentList";
import { useKnowledgeMutations } from "./logic/useKnowledgeMutations";
import type { KnowledgeDocumentRecord } from "@/types/api";

type KnowledgePageClientProps = {
  initialDocuments: KnowledgeDocumentRecord[];
};

export function KnowledgePageClient({
  initialDocuments,
}: KnowledgePageClientProps) {
  const t = useTranslations("knowledge");
  const [documents, setDocuments] =
    useState<KnowledgeDocumentRecord[]>(initialDocuments);

  const { uploading, deleting, uploadDocument, deleteDocument } =
    useKnowledgeMutations(setDocuments, {
      uploadSuccess: t("uploadSuccess"),
      uploadError: t("uploadError"),
      uploadProviderError: t("uploadProviderError"),
      uploadLimitError: t("uploadLimitError"),
      deleteSuccess: t("deleteSuccess"),
      deleteError: t("deleteError"),
    });

  const totalChars = documents.reduce((sum, d) => sum + d.charCount, 0);
  const approxTokens = Math.ceil(totalChars / 4);

  function fmtTokens(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
    return String(n);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-8">
      {/* Page header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("pageTitle")}
        </h1>
        <p className="text-sm text-muted-foreground">{t("pageDescription")}</p>
      </div>

      {/* Upload section */}
      <section aria-labelledby="upload-heading">
        <h2
          id="upload-heading"
          className="mb-3 text-sm font-medium text-muted-foreground uppercase tracking-wide"
        >
          {t("uploadSection")}
        </h2>
        <UploadForm uploading={uploading} onUpload={uploadDocument} />
      </section>

      {/* Documents list */}
      <section aria-labelledby="docs-heading">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2
            id="docs-heading"
            className="text-sm font-medium text-muted-foreground uppercase tracking-wide"
          >
            {t("documentsSection")} ({documents.length})
          </h2>
          {documents.length > 0 && (
            <span className="text-xs text-muted-foreground tabular-nums">
              {t("approxTokens", { count: fmtTokens(approxTokens) })}
            </span>
          )}
        </div>
        <DocumentList
          documents={documents}
          deletingId={deleting}
          onDelete={deleteDocument}
        />
      </section>
    </div>
  );
}
