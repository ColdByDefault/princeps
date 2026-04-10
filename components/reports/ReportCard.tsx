/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

"use client";

import { useTranslations } from "next-intl";
import { Trash2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import type { AssistantReportRecord } from "@/types/api";

type Props = {
  report: AssistantReportRecord;
  onDelete: (id: string) => void;
  isDeleting: boolean;
};

export function ReportCard({ report, onDelete, isDeleting }: Props) {
  const t = useTranslations("reports");

  const date = new Date(report.createdAt);
  const dateStr = date.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const timeStr = date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <p className="text-xs text-muted-foreground">
            {dateStr} · {timeStr}
          </p>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {report.toolsCalled.map((tool, i) => (
              <Badge key={i} variant="secondary" className="text-xs font-mono">
                {tool}
              </Badge>
            ))}
          </div>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="cursor-pointer shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => onDelete(report.id)}
                  disabled={isDeleting}
                  aria-label={t("deleteAriaLabel")}
                />
              }
            >
              <Trash2 className="h-4 w-4" />
            </TooltipTrigger>
            <TooltipContent>{t("delete")}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Stats row */}
      <div className="flex gap-4 text-xs text-muted-foreground">
        <span>
          <span className="font-medium text-foreground">
            {report.toolCallCount}
          </span>{" "}
          {t("toolCalls")}
        </span>
        <span>
          <span className="font-medium text-foreground">
            ~{report.tokenUsage}
          </span>{" "}
          {t("tokens")}
        </span>
      </div>

      {/* Detail KV rows */}
      {report.details.length > 0 && (
        <div className="space-y-1.5 border-t border-border/60 pt-3">
          {report.details.map((detail, i) => (
            <div key={i} className="flex items-start gap-2 text-xs">
              {detail.ok ? (
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500 mt-0.5" />
              ) : (
                <XCircle className="h-3.5 w-3.5 shrink-0 text-destructive mt-0.5" />
              )}
              <div className="min-w-0">
                <span className="font-mono text-muted-foreground">
                  {detail.tool}
                </span>
                {Object.entries(detail.kv).length > 0 && (
                  <span className="ml-1.5 text-muted-foreground/70">
                    {Object.entries(detail.kv)
                      .map(([k, v]) => `${k}:${String(v)}`)
                      .join(" · ")}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
