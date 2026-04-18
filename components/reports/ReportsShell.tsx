/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version beta
 * @since beta
 * @module
 * @description
 */

"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FileBarChart2, Trash2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReportCard } from "./ReportCard";
import { useReportsMutations } from "./logic/useReportsMutations";
import type { AssistantReportRecord } from "@/types/api";

type Props = {
  initialReports: AssistantReportRecord[];
};

export function ReportsShell({ initialReports }: Props) {
  const t = useTranslations("reports");
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const { reports, deleteOne, deletingId, clearAll, clearingAll } =
    useReportsMutations(initialReports);

  async function handleRefresh() {
    setRefreshing(true);
    router.refresh();
    // brief visual feedback — router.refresh() is async in the background
    setTimeout(() => setRefreshing(false), 800);
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
      {/* Page header */}
      <div className="mb-8 flex items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("pageTitle")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("pageDescription")}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="cursor-pointer text-muted-foreground"
            onClick={handleRefresh}
            disabled={refreshing}
            aria-label={t("refresh")}
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
          </Button>
          {reports.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="cursor-pointer gap-1.5 text-destructive hover:text-destructive"
              onClick={clearAll}
              disabled={clearingAll}
              aria-label={t("clearAllAriaLabel")}
            >
              <Trash2 className="h-3.5 w-3.5" />
              {clearingAll ? t("clearingAll") : t("clearAll")}
            </Button>
          )}
        </div>
      </div>

      {/* Empty state */}
      {reports.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-20 text-center">
          <FileBarChart2 className="h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm font-medium text-muted-foreground">
            {t("empty")}
          </p>
          <p className="text-xs text-muted-foreground/60">{t("emptyHint")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              onDelete={deleteOne}
              isDeleting={deletingId === report.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
