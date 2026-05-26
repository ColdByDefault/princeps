/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version canary-v1.1.11
 * @since beta
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
  const tCommon = useTranslations("common");

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
    <div
      id={`report-${report.id}`}
      className="rounded-lg border border-border bg-card p-4 space-y-3"
    >
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
            <TooltipContent>{tCommon("actions.delete")}</TooltipContent>
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
          {report.details.map((detail, i) => {
            const agent =
              typeof detail.kv["agent"] === "string"
                ? (detail.kv["agent"] as string)
                : null;
            const summary =
              typeof detail.kv["summary"] === "string"
                ? (detail.kv["summary"] as string)
                : null;
            const isAgentOuter =
              agent !== null && detail.tool.startsWith("run_");
            // Inner agent tool calls indent under their parent agent row.
            const isAgentInner =
              agent !== null && !detail.tool.startsWith("run_");
            // KV entries to render inline (drop agent/summary which get special treatment).
            const inlineKv = Object.entries(detail.kv).filter(
              ([k]) => k !== "agent" && k !== "summary",
            );
            return (
              <div
                key={i}
                className={`flex items-start gap-2 text-xs ${
                  isAgentInner ? "ml-5 border-l-2 border-border/60 pl-2" : ""
                }`}
              >
                {detail.ok ? (
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500 mt-0.5" />
                ) : (
                  <XCircle className="h-3.5 w-3.5 shrink-0 text-destructive mt-0.5" />
                )}
                <div className="min-w-0 space-y-0.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {agent && (
                      <Badge
                        variant="outline"
                        className="text-[10px] font-medium border-violet-500/40 bg-violet-500/10 text-violet-600 dark:text-violet-300"
                      >
                        {t("agentBadge", { name: agent })}
                      </Badge>
                    )}
                    <span className="font-mono text-muted-foreground">
                      {detail.tool}
                    </span>
                    {inlineKv.length > 0 && (
                      <span className="text-muted-foreground/70">
                        {inlineKv
                          .map(([k, v]) => `${k}:${String(v)}`)
                          .join(" · ")}
                      </span>
                    )}
                  </div>
                  {isAgentOuter && summary && (
                    <p className="text-muted-foreground/80 italic">{summary}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
