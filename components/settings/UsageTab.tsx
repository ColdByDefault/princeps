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
      ? `${(n / 1_000).toFixed(1)}k`
      : String(n);
}

function pct(used: number, limit: number): number {
  if (limit === 0) return 100;
  return Math.min(100, Math.round((used / limit) * 100));
}

type QuotaCardProps = {
  label: string;
  used: number;
  limit: number;
  note?: string;
};

function QuotaCard({ label, used, limit, note }: QuotaCardProps) {
  const unlimited = limit < 0;
  const p = unlimited ? 0 : pct(used, limit);
  const color = "bg-tier-accent";

  return (
    <div className="rounded-lg border border-border/60 bg-card p-4 space-y-2.5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium leading-snug">{label}</p>
        <span className="text-xs text-muted-foreground tabular-nums shrink-0">
          {unlimited ? `${fmt(used)} / ∞` : `${fmt(used)} / ${fmt(limit)}`}
        </span>
      </div>
      <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full transition-all ${color}`}
          style={{ width: unlimited ? "0%" : `${p}%` }}
        />
      </div>
      {note && (
        <p className="text-xs text-muted-foreground leading-snug">{note}</p>
      )}
    </div>
  );
}

function SectionHeading({ label }: { label: string }) {
  return (
    <div className="col-span-full pt-2">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground pb-2">
        {label}
      </p>
      <div className="border-t border-border/40" />
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
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex items-center justify-between gap-4 pb-2">
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
      <div className="flex items-center justify-between py-2 border-y border-border/60">
        <p className="text-sm font-medium text-muted-foreground">
          {t("planLabel")}
        </p>
        <PlanBadge tier={usage.tier} />
      </div>

      {/* Quota grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* AI & Chat */}
        <SectionHeading label={t("sectionAI")} />
        <QuotaCard
          label={t("messagesTitle")}
          used={usage.messagesUsed}
          limit={usage.messagesLimit}
        />
        <QuotaCard
          label={t("tokensTitle")}
          used={usage.tokensUsed}
          limit={usage.tokensLimit}
        />
        <QuotaCard
          label={t("toolCallsTitle")}
          used={usage.toolCallsUsed}
          limit={usage.toolCallsLimit}
          note={t("toolCallsNote")}
        />
        <QuotaCard
          label={t("chatsTitle")}
          used={usage.chatsStored}
          limit={usage.chatsLimit}
          note={t("chatsNote")}
        />

        {/* Knowledge */}
        <SectionHeading label={t("sectionKnowledge")} />
        <QuotaCard
          label={t("knowledgeDocsTitle")}
          used={usage.knowledgeDocsStored}
          limit={usage.knowledgeDocsLimit}
          note={t("knowledgeDocsNote")}
        />
        <QuotaCard
          label={t("knowledgeCharsTitle")}
          used={usage.knowledgeCharsUsed}
          limit={usage.knowledgeCharsLimit}
          note={t("knowledgeCharsNote")}
        />

        {/* Stored data */}
        <SectionHeading label={t("sectionData")} />
        <QuotaCard
          label={t("tasksTitle")}
          used={usage.tasksStored}
          limit={usage.tasksLimit}
          note={t("tasksNote")}
        />
        <QuotaCard
          label={t("contactsTitle")}
          used={usage.contactsStored}
          limit={usage.contactsLimit}
          note={t("contactsNote")}
        />
        <QuotaCard
          label={t("meetingsTitle")}
          used={usage.meetingsStored}
          limit={usage.meetingsLimit}
          note={t("meetingsNote")}
        />
        <QuotaCard
          label={t("decisionsTitle")}
          used={usage.decisionsStored}
          limit={usage.decisionsLimit}
          note={t("decisionsNote")}
        />
        <QuotaCard
          label={t("goalsTitle")}
          used={usage.goalsStored}
          limit={usage.goalsLimit}
          note={t("goalsNote")}
        />
        <QuotaCard
          label={t("memoryTitle")}
          used={usage.memoryStored}
          limit={usage.memoryLimit}
          note={t("memoryNote")}
        />

        {/* Generation */}
        <SectionHeading label={t("sectionGeneration")} />
        <QuotaCard
          label={t("briefingTitle")}
          used={usage.briefingsGenerated}
          limit={usage.briefingsLimit}
          note={t("briefingNote")}
        />
        <QuotaCard
          label={t("prepPackTitle")}
          used={usage.prepPacksGenerated}
          limit={usage.prepPacksLimit}
          note={t("prepPackNote")}
        />

        {/* Voice */}
        <SectionHeading label={t("sectionVoice")} />
        <QuotaCard
          label={t("voiceRequestsTitle")}
          used={usage.voiceRequestsUsed}
          limit={usage.voiceRequestsLimit}
          note={t("voiceRequestsNote")}
        />
        <QuotaCard
          label={t("voiceRequestsMonthlyTitle")}
          used={usage.voiceRequestsMonthlyUsed}
          limit={usage.voiceRequestsMonthlyLimit}
          note={t("voiceRequestsMonthlyNote")}
        />
        <QuotaCard
          label={t("voiceMinutesTitle")}
          used={usage.voiceMinutesUsed}
          limit={usage.voiceMinutesLimit}
          note={t("voiceMinutesNote")}
        />
      </div>

      {/* Reset footer */}
      <div className="border-t border-border/60 pt-4">
        <p className="text-xs text-muted-foreground">
          {t("resetLabel")}: <span className="font-medium">{resetLabel}</span>
        </p>
      </div>

      {/* Budget disclaimer */}
      <div className="rounded-lg border border-border/60 bg-muted/40 p-4">
        <p className="text-xs font-medium text-foreground mb-1">
          {t("budgetNoteTitle")}
        </p>
        <p className="text-xs text-muted-foreground">{t("budgetNoteBody")}</p>
      </div>
    </div>
  );
}
