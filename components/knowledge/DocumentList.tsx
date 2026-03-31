/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

"use client";

import { useState, useRef } from "react";
import { FileText, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NoticePanel } from "@/components/shared";
import { ConfirmDialog } from "@/components/shared";
import { useNotice } from "@/components/shared";
import { getMessage } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { KnowledgeDocumentRecord } from "@/types/api";
import type { MessageDictionary } from "@/types/i18n";

interface DocumentListProps {
  messages: MessageDictionary;
  documents: KnowledgeDocumentRecord[];
  onDocumentsChange: (docs: KnowledgeDocumentRecord[]) => void;
  docLimit: number;
}

export function DocumentList({
  messages,
  documents,
  onDocumentsChange,
  docLimit,
}: DocumentListProps) {
  const { addNotice, removeNotice } = useNotice();
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext !== "txt" && ext !== "md") {
      setUploadError(
        getMessage(
          messages,
          "knowledge.documents.fileTypeError",
          "Only .txt and .md files are accepted.",
        ),
      );
      e.target.value = "";
      return;
    }

    setUploadError(null);
    setUploading(true);
    const loadingId = addNotice({
      type: "loading",
      title: getMessage(
        messages,
        "knowledge.documents.uploading",
        "Uploading\u2026",
      ),
    });

    try {
      const form = new FormData();
      form.append("file", file);

      const res = await fetch("/api/knowledge/documents", {
        method: "POST",
        body: form,
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(
          data.error ??
            getMessage(
              messages,
              "knowledge.documents.uploadError",
              "Upload failed. Please try again.",
            ),
        );
      }

      const newDoc = (await res.json()) as {
        documentId: string;
        charCount: number;
      };

      // Refetch list to get the full record
      const listRes = await fetch("/api/knowledge/documents");
      if (listRes.ok) {
        const listData = (await listRes.json()) as {
          documents: KnowledgeDocumentRecord[];
        };
        onDocumentsChange(listData.documents);
      }

      removeNotice(loadingId);
      addNotice({
        type: "success",
        title: getMessage(
          messages,
          "knowledge.documents.uploadSuccess",
          "Document uploaded.",
        ),
      });
      void newDoc;
    } catch (err) {
      removeNotice(loadingId);
      addNotice({
        type: "error",
        title:
          err instanceof Error
            ? err.message
            : getMessage(
                messages,
                "knowledge.documents.uploadError",
                "Upload failed. Please try again.",
              ),
      });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleDelete(documentId: string) {
    setDeleteTarget(null);
    const res = await fetch(`/api/knowledge/documents/${documentId}`, {
      method: "DELETE",
    });

    if (res.ok) {
      onDocumentsChange(documents.filter((d) => d.id !== documentId));
      addNotice({
        type: "success",
        title: getMessage(
          messages,
          "knowledge.documents.deleteSuccess",
          "Document deleted.",
        ),
      });
    } else {
      addNotice({
        type: "error",
        title: getMessage(
          messages,
          "knowledge.documents.deleteError",
          "Could not delete document.",
        ),
      });
    }
  }

  const deleteDoc = documents.find((d) => d.id === deleteTarget);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span
          title={getMessage(
            messages,
            "knowledge.documents.quotaLabel",
            "Documents stored",
          )}
          className={cn(
            "rounded px-1.5 py-0.5 text-sm tabular-nums",
            documents.length >= docLimit
              ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
              : documents.length >= Math.ceil(docLimit * 0.8)
                ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                : "text-muted-foreground",
          )}
        >
          {documents.length}&nbsp;/&nbsp;{docLimit}
        </span>
        <Button
          size="sm"
          disabled={uploading || documents.length >= docLimit}
          onClick={() => fileInputRef.current?.click()}
          className="cursor-pointer gap-2"
          aria-label={getMessage(
            messages,
            "knowledge.documents.upload",
            "Upload file",
          )}
        >
          <Upload className="size-4" />
          {uploading
            ? getMessage(
                messages,
                "knowledge.documents.uploading",
                "Uploading\u2026",
              )
            : getMessage(messages, "knowledge.documents.upload", "Upload file")}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.md"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {uploadError && (
        <NoticePanel
          type="error"
          title={uploadError}
          dismissLabel={getMessage(messages, "shared.dismiss", "Dismiss")}
          onDismiss={() => setUploadError(null)}
        />
      )}

      {documents.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/70 bg-card/40 px-6 py-12 text-center">
          <FileText className="mx-auto mb-3 size-8 text-muted-foreground/50" />
          <p className="font-medium">
            {getMessage(
              messages,
              "knowledge.documents.empty",
              "No documents uploaded yet.",
            )}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {getMessage(
              messages,
              "knowledge.documents.emptyBody",
              "Upload a .txt or .md file to give the assistant access to your knowledge.",
            )}
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {documents.map((doc) => (
            <li
              key={doc.id}
              className="flex items-center justify-between rounded-xl border border-border/60 bg-card/60 px-4 py-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                <FileText className="size-4 shrink-0 text-primary" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{doc.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {doc.charCount.toLocaleString()}{" "}
                    {getMessage(messages, "knowledge.documents.chars", "chars")}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="cursor-pointer shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => setDeleteTarget(doc.id)}
                aria-label={getMessage(
                  messages,
                  "knowledge.documents.deleteConfirm",
                  "Delete",
                )}
              >
                <Trash2 className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title={getMessage(
          messages,
          "knowledge.documents.deleteTitle",
          "Delete this document?",
        )}
        description={
          deleteDoc
            ? `"${deleteDoc.name}" — ${getMessage(messages, "knowledge.documents.deleteDescription", "This will permanently remove the document and all its stored chunks.")}`
            : getMessage(
                messages,
                "knowledge.documents.deleteDescription",
                "This will permanently remove the document and all its stored chunks.",
              )
        }
        confirmLabel={getMessage(
          messages,
          "knowledge.documents.deleteConfirm",
          "Delete",
        )}
        cancelLabel={getMessage(messages, "shared.cancel", "Cancel")}
        confirmClassName="bg-destructive text-white hover:bg-destructive/90"
        onConfirm={() => {
          if (deleteTarget) void handleDelete(deleteTarget);
        }}
      />
    </div>
  );
}
