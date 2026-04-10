/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import type { AssistantReportRecord } from "@/types/api";

export function useReportsMutations(initial: AssistantReportRecord[]) {
  const t = useTranslations("reports");
  const [reports, setReports] = useState(initial);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [clearingAll, setClearingAll] = useState(false);

  async function deleteOne(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/reports/${id}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error(t("deleteError"));
        return;
      }
      setReports((prev) => prev.filter((r) => r.id !== id));
      toast.success(t("deleteSuccess"));
    } catch {
      toast.error(t("deleteError"));
    } finally {
      setDeletingId(null);
    }
  }

  async function clearAll() {
    setClearingAll(true);
    try {
      const res = await fetch("/api/reports", { method: "DELETE" });
      if (!res.ok) {
        toast.error(t("clearAllError"));
        return;
      }
      setReports([]);
      toast.success(t("clearAllSuccess"));
    } catch {
      toast.error(t("clearAllError"));
    } finally {
      setClearingAll(false);
    }
  }

  return { reports, deleteOne, deletingId, clearAll, clearingAll };
}
