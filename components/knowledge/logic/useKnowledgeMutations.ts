/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { useState } from "react";
import { toast } from "sonner";
import type { KnowledgeDocumentRecord } from "@/types/api";

type Translations = {
  uploadSuccess: string;
  uploadError: string;
  uploadProviderError: string;
  uploadLimitError: string;
  deleteSuccess: string;
  deleteError: string;
};

export function useKnowledgeMutations(
  setDocuments: React.Dispatch<React.SetStateAction<KnowledgeDocumentRecord[]>>,
  t: Translations,
) {
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function uploadDocument(file: File): Promise<boolean> {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("name", file.name);

      const res = await fetch("/api/knowledge/upload", {
        method: "POST",
        body: formData,
      });

      if (res.status === 403) {
        const data = (await res.json()) as { error?: string };
        toast.error(data.error ?? t.uploadLimitError);
        return false;
      }

      if (res.status === 502) {
        toast.error(t.uploadProviderError);
        return false;
      }

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        toast.error(data.error ?? t.uploadError);
        return false;
      }

      const data = (await res.json()) as {
        document: KnowledgeDocumentRecord;
      };
      setDocuments((prev) => [data.document, ...prev]);
      toast.success(t.uploadSuccess);
      return true;
    } catch {
      toast.error(t.uploadError);
      return false;
    } finally {
      setUploading(false);
    }
  }

  async function deleteDocument(documentId: string): Promise<boolean> {
    setDeleting(documentId);
    try {
      const res = await fetch(`/api/knowledge/${documentId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      setDocuments((prev) => prev.filter((d) => d.id !== documentId));
      toast.success(t.deleteSuccess);
      return true;
    } catch {
      toast.error(t.deleteError);
      return false;
    } finally {
      setDeleting(null);
    }
  }

  return { uploading, deleting, uploadDocument, deleteDocument };
}
