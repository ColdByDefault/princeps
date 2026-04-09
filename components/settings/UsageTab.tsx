/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

"use client";

import { useState, useTransition } from "react";
import { RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { PlanBadge } from "@/components/shared";
import type { UsageSummary } from "@/types/billing";

function fmt(n: number): string {
  return n >= 1_000_000
    ? `${(n / 1_000_000).toFixed(1)}M`
    : n >= 1_000
      ? `${(n / 1_000).toFixed(0)}k`
      : String(n);
}

function pct(used: number, limit: number): number {
  if (limit === 0) return 100;
  return Math.min(100, Math.round((used / limit) * 100));
}

function indicatorColor(p: number): string {
  if (p >= 90) return "bg-destructive";
  if (p >= 70) return "bg-amber-500";
  return "bg-primary";
}

type QuotaRowProps = {
  label: string;
  used: number;
  limit: number;
  note?: string;
};

function QuotaRow({ label, used, limit, note }: QuotaRowProps) {
  const unlimited = limit < 0;
  const p = unlimited ? 0 : pct(used, limit);
  const color = unlimited ? "bg-primary" : indicatorColor(p);

  return (
    <div className="space-y-2 py-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{label}</p>
        <span className="text-sm text-muted-foreground tabular-nums ml-auto">
          {unlimited ? `${fmt(used)} / ∞` : `${fmt(used)} / ${fmt(limit)}`}
        </span>
      </div>
      <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full transition-all ${color}`}
          style={{ width: unlimited ? "0%" : `${p}%` }}
        />
      </div>
      {note && <p className="text-xs text-muted-foreground">{note}</p>}
    </div>
  );
}

type UsageTabProps = {
  usage: UsageSummary;
};

export function UsageTab({ usage: initialUsage }: UsageTabProps) {
  const t = useTranslations("settings.usage");
  const [usage, setUsage] = useState<UsageSummary>(initialUsage);
  const [isPending, startTransition] = useTransition();

  function handleRefresh() {
    startTransition(async () => {
      const res = await fetch("/api/settings/usage");
      if (res.ok) {
        const updated = (await res.json()) as UsageSummary;
        setUsage(updated);
      }
    });
  }

  const resetLabel = usage.monthlyResetDate
    ? `${usage.monthlyResetDate}`
    : t("resetUnknown");

  return (
    <div className="space-y-2">
      {/* Section header */}
      <div className="flex items-center justify-between gap-4 pb-4">
        <div className="space-y-0.5">
          <p className="text-sm font-medium">{t("title")}</p>
          <p className="text-sm text-muted-foreground">{t("description")}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="cursor-pointer shrink-0 rounded-full border-border/70"
          disabled={isPending}
          onClick={handleRefresh}
        >
          <RefreshCw
            className={`size-3.5 ${isPending ? "animate-spin" : ""}`}
          />
          {isPending ? t("refreshing") : t("refresh")}
        </Button>
      </div>

      {/* Plan header */}
      <div className="flex items-center justify-between py-4">
        <p className="text-sm font-medium text-muted-foreground">
          {t("planLabel")}
        </p>
        <PlanBadge tier={usage.tier} />
      </div>

      <div className="border-t border-border/60" />

      {/* Monthly quotas */}
      <div className="divide-y divide-border/60">
        <QuotaRow
          label={t("messagesTitle")}
          used={usage.messagesUsed}
          limit={usage.messagesLimit}
        />
        <QuotaRow
          label={t("tokensTitle")}
          used={usage.tokensUsed}
          limit={usage.tokensLimit}
        />
        <QuotaRow
          label={t("chatsTitle")}
          used={usage.chatsStored}
          limit={usage.chatsLimit}
          note={t("chatsNote")}
        />
        <QuotaRow
          label={t("toolCallsTitle")}
          used={usage.toolCallsUsed}
          limit={usage.toolCallsLimit}
          note={t("toolCallsNote")}
        />
        <QuotaRow
          label={t("knowledgeDocsTitle")}
          used={usage.knowledgeDocsStored}
          limit={usage.knowledgeDocsLimit}
          note={t("knowledgeDocsNote")}
        />
        <QuotaRow
          label={t("knowledgeCharsTitle")}
          used={usage.knowledgeCharsUsed}
          limit={usage.knowledgeCharsLimit}
          note={t("knowledgeCharsNote")}
        />
        <QuotaRow
          label={t("contactsTitle")}
          used={usage.contactsStored}
          limit={usage.contactsLimit}
          note={t("contactsNote")}
        />
        <QuotaRow
          label={t("tasksTitle")}
          used={usage.tasksStored}
          limit={usage.tasksLimit}
          note={t("tasksNote")}
        />
        <QuotaRow
          label={t("meetingsTitle")}
          used={usage.meetingsStored}
          limit={usage.meetingsLimit}
          note={t("meetingsNote")}
        />
        <QuotaRow
          label={t("prepPackTitle")}
          used={usage.prepPacksGenerated}
          limit={usage.prepPacksLimit}
          note={t("prepPackNote")}
        />
        <QuotaRow
          label={t("decisionsTitle")}
          used={usage.decisionsStored}
          limit={usage.decisionsLimit}
          note={t("decisionsNote")}
        />
        <QuotaRow
          label={t("goalsTitle")}
          used={usage.goalsStored}
          limit={usage.goalsLimit}
          note={t("goalsNote")}
        />
        <QuotaRow
          label={t("memoryTitle")}
          used={usage.memoryStored}
          limit={usage.memoryLimit}
          note={t("memoryNote")}
        />
      </div>

      {/* Reset footer */}
      <div className="border-t border-border/60 pt-4">
        <p className="text-xs text-muted-foreground">
          {t("resetLabel")}: <span className="font-medium">{resetLabel}</span>
        </p>
      </div>
    </div>
  );
}
