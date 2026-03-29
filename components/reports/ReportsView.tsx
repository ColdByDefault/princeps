/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

"use client";

import { ClipboardList, CheckCircle2 } from "lucide-react";
import { getMessage } from "@/lib/i18n";
import type { MessageDictionary } from "@/types/i18n";

export type ReportEntry = {
  id: string;
  toolsCalled: string[];
  summary: string;
  createdAt: string; // ISO string
};

interface ReportsViewProps {
  messages: MessageDictionary;
  reports: ReportEntry[];
}

const TOOL_ICON_COLORS: Record<string, string> = {
  create_contact: "text-sky-500",
  create_meeting: "text-violet-500",
  create_task: "text-amber-500",
};

export function ReportsView({ messages, reports }: ReportsViewProps) {
  const toolLabel = (tool: string): string => {
    const key = `reports.tool.${tool}` as Parameters<typeof getMessage>[1];
    return getMessage(
      messages,
      key,
      tool.replace("create_", "").replace("_", " "),
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          {getMessage(messages, "reports.title", "Assistant Reports")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {getMessage(
            messages,
            "reports.subtitle",
            "Every time the assistant creates a contact, meeting, or task on your behalf, a brief report is recorded here.",
          )}
        </p>
      </div>

      {/* Empty state */}
      {reports.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-muted/30 px-6 py-14 text-center">
          <ClipboardList className="mb-4 size-10 text-muted-foreground/50" />
          <p className="font-medium text-muted-foreground">
            {getMessage(messages, "reports.empty", "No reports yet.")}
          </p>
          <p className="mt-1 text-sm text-muted-foreground/70">
            {getMessage(
              messages,
              "reports.emptyBody",
              "Reports are generated automatically when the assistant performs actions for you.",
            )}
          </p>
        </div>
      )}

      {/* Report cards */}
      {reports.length > 0 && (
        <div className="space-y-4">
          {reports.map((report) => (
            <div
              key={report.id}
              className="rounded-2xl border border-border/60 bg-card px-5 py-4 shadow-sm"
            >
              {/* Timestamp + actions row */}
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <time
                  dateTime={report.createdAt}
                  className="text-xs text-muted-foreground"
                >
                  {new Date(report.createdAt).toLocaleString()}
                </time>
                <div className="flex flex-wrap gap-2">
                  {report.toolsCalled.map((tool, i) => (
                    <span
                      key={i}
                      className="flex items-center gap-1.5 rounded-full border border-border/50 bg-muted/60 px-2.5 py-0.5 text-xs font-medium"
                    >
                      <CheckCircle2
                        className={`size-3 ${TOOL_ICON_COLORS[tool] ?? "text-emerald-500"}`}
                      />
                      {toolLabel(tool)}
                    </span>
                  ))}
                </div>
              </div>

              {/* LLM-generated summary */}
              <p className="text-sm leading-relaxed text-foreground/80">
                {report.summary}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
