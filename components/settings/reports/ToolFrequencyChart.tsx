/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version canary-v1.1.8
 * @since canary-v1.1.4
 */

"use client";

import { useTranslations } from "next-intl";
import { BarChart2 } from "lucide-react";
import type { ToolFrequencyData } from "@/types/api";

type Props = {
  data: ToolFrequencyData;
};

export function ToolFrequencyChart({ data }: Props) {
  const t = useTranslations("reports.frequency");

  if (data.top.length === 0) {
    return null;
  }

  const max = data.top[0]?.count ?? 1;

  return (
    <div className="rounded-lg border border-border bg-card p-5 space-y-4 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <BarChart2 className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">{t("title")}</h2>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>{t("totalCalls", { count: data.total })}</span>
          <span>·</span>
          <span>{t("sessions", { count: data.sessionCount })}</span>
        </div>
      </div>

      {/* Bar rows */}
      <ol className="space-y-2.5">
        {data.top.map(({ tool, count }, i) => {
          const pct = Math.round((count / max) * 100);
          return (
            <li key={tool} className="flex items-center gap-3 text-xs">
              <span className="w-4 shrink-0 text-right tabular-nums text-muted-foreground">
                {i + 1}
              </span>
              <span className="w-40 shrink-0 truncate font-mono text-foreground">
                {tool}
              </span>
              <div className="flex-1 rounded-full bg-muted overflow-hidden h-2">
                <div
                  className="h-2 rounded-full bg-primary transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="w-6 shrink-0 text-right tabular-nums text-muted-foreground">
                {count}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

