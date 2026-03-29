/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

"use client";

import { useState } from "react";
import {
  CalendarDays,
  CheckSquare,
  AlertTriangle,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { getMessage } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import type { MessageDictionary } from "@/types/i18n";

export type SerializedSnapshot = {
  nextMeeting: { title: string; scheduledAt: string } | null;
  taskCounts: { urgent: number; high: number; normal: number; low: number };
  totalOpen: number;
  overdue: number;
};

export type BriefData = { content: string; generatedAt: string } | null;

interface BriefingCardProps {
  messages: MessageDictionary;
  snapshot: SerializedSnapshot;
  initialBrief: BriefData;
}

const STALE_MS = 12 * 60 * 60 * 1000;

export function BriefingCard({
  messages,
  snapshot,
  initialBrief,
}: BriefingCardProps) {
  const { nextMeeting, taskCounts, totalOpen, overdue } = snapshot;
  const urgentOrHigh = taskCounts.urgent + taskCounts.high;

  const [brief, setBrief] = useState<BriefData>(initialBrief);
  const [loading, setLoading] = useState(false);

  const isStale =
    brief !== null &&
    Date.now() - new Date(brief.generatedAt).getTime() > STALE_MS;

  async function handleGenerate() {
    setLoading(true);
    try {
      const res = await fetch("/api/briefing", { method: "POST" });
      if (res.ok) {
        const data = (await res.json()) as {
          content: string;
          generatedAt: string;
        };
        setBrief(data);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-[1.75rem] border border-border/70 bg-background/70 p-5">
      <p className="text-sm font-semibold tracking-[0.22em] text-muted-foreground uppercase">
        {getMessage(messages, "home.briefing.label", "Today's brief")}
      </p>

      {/* Next meeting */}
      <div className="flex items-start gap-3">
        <CalendarDays className="mt-0.5 size-4 shrink-0 text-violet-500" />
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {getMessage(messages, "home.briefing.nextMeeting", "Next meeting")}
          </p>
          {nextMeeting ? (
            <>
              <p className="mt-0.5 text-sm font-medium leading-snug truncate">
                {nextMeeting.title}
              </p>
              <p className="text-xs text-muted-foreground">
                {new Date(nextMeeting.scheduledAt).toLocaleDateString(
                  undefined,
                  {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  },
                )}
              </p>
            </>
          ) : (
            <p className="mt-0.5 text-sm text-muted-foreground/70">
              {getMessage(
                messages,
                "home.briefing.noMeetings",
                "No upcoming meetings",
              )}
            </p>
          )}
        </div>
      </div>

      {/* Open tasks */}
      <div className="flex items-start gap-3">
        <CheckSquare className="mt-0.5 size-4 shrink-0 text-amber-500" />
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {getMessage(messages, "home.briefing.openTasks", "Open tasks")}
          </p>
          {totalOpen === 0 ? (
            <p className="mt-0.5 text-sm text-muted-foreground/70">
              {getMessage(messages, "home.briefing.noTasks", "No open tasks")}
            </p>
          ) : (
            <div className="mt-0.5 flex flex-wrap gap-2">
              <span className="text-sm font-medium">{totalOpen}</span>
              {urgentOrHigh > 0 && (
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
                  {urgentOrHigh}{" "}
                  {getMessage(
                    messages,
                    taskCounts.urgent > 0
                      ? "home.briefing.urgent"
                      : "home.briefing.high",
                    "urgent",
                  )}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Overdue warning */}
      {overdue > 0 && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 dark:border-amber-800/40 dark:bg-amber-900/20">
          <AlertTriangle className="size-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
          <p className="text-xs text-amber-700 dark:text-amber-400">
            {overdue} {getMessage(messages, "home.briefing.overdue", "overdue")}
          </p>
        </div>
      )}

      {/* Divider */}
      <hr className="border-border/50" />

      {/* AI brief section */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Sparkles className="size-3.5 text-primary" />
            <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
              {getMessage(messages, "home.briefing.ai.label", "AI brief")}
            </p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 gap-1.5 px-2 text-xs"
            onClick={handleGenerate}
            disabled={loading}
          >
            <RefreshCw className={`size-3 ${loading ? "animate-spin" : ""}`} />
            {loading
              ? getMessage(
                  messages,
                  "home.briefing.generating",
                  "Generating\u2026",
                )
              : brief
                ? getMessage(messages, "home.briefing.regenerate", "Regenerate")
                : getMessage(
                    messages,
                    "home.briefing.generate",
                    "Generate brief",
                  )}
          </Button>
        </div>

        {/* Stale warning */}
        {isStale && (
          <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 dark:border-amber-800/40 dark:bg-amber-900/20">
            <AlertTriangle className="size-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
            <p className="text-xs text-amber-700 dark:text-amber-400">
              {getMessage(
                messages,
                "home.briefing.stale",
                "Brief is over 12 hours old",
              )}
            </p>
          </div>
        )}

        {brief ? (
          <>
            <p className="text-sm leading-relaxed text-foreground/85">
              {brief.content}
            </p>
            <p className="text-xs text-muted-foreground/60">
              {getMessage(messages, "home.briefing.generatedAt", "Generated")}{" "}
              {new Date(brief.generatedAt).toLocaleString(undefined, {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </>
        ) : (
          <p className="text-sm text-muted-foreground/60">
            {getMessage(
              messages,
              "home.briefing.ai.empty",
              "No brief generated yet.",
            )}
          </p>
        )}
      </div>
    </div>
  );
}
