/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { CalendarDays, CheckSquare, AlertTriangle } from "lucide-react";
import { getMessage } from "@/lib/i18n";
import type { MessageDictionary } from "@/types/i18n";
import type { BriefingSnapshot } from "@/lib/briefing/snapshot";

interface BriefingCardProps {
  messages: MessageDictionary;
  snapshot: BriefingSnapshot;
}

export function BriefingCard({ messages, snapshot }: BriefingCardProps) {
  const { nextMeeting, taskCounts, totalOpen, overdue } = snapshot;

  const urgentOrHigh = taskCounts.urgent + taskCounts.high;

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
                {nextMeeting.scheduledAt.toLocaleDateString(undefined, {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
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
    </div>
  );
}
