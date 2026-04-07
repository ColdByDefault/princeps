/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

"use client";

import { Check, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { PLAN_LIMITS } from "@/types/billing";
import type { Tier } from "@/types/billing";

const TIERS: Tier[] = ["free", "pro", "premium", "enterprise"];

function fmt(n: number): string {
  return n >= 1_000_000
    ? `${(n / 1_000_000).toFixed(1)}M`
    : n >= 1_000
      ? `${(n / 1_000).toFixed(0)}k`
      : String(n);
}

const TIER_COLORS: Record<Tier, string> = {
  free: "border-gray-300 dark:border-gray-600",
  pro: "border-blue-400 dark:border-blue-600",
  premium: "border-purple-400 dark:border-purple-600",
  enterprise: "border-zinc-500 dark:border-zinc-500",
};

const TIER_BADGE_COLORS: Record<Tier, string> = {
  free: "bg-gray-100 text-gray-600 dark:bg-gray-800/40 dark:text-gray-400",
  pro: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  premium:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  enterprise:
    "bg-zinc-200 text-zinc-700 dark:bg-zinc-800/40 dark:text-zinc-300",
};

type PricingShellProps = {
  currentTier: Tier;
};

export function PricingShell({ currentTier }: PricingShellProps) {
  const t = useTranslations("pricing");

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("pageTitle")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("pageSubtitle")}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {TIERS.map((tier) => {
          const limits = PLAN_LIMITS[tier];
          const isCurrent = tier === currentTier;

          return (
            <div
              key={tier}
              className={cn(
                "relative flex flex-col rounded-xl border-2 bg-card p-5 shadow-sm transition-shadow",
                isCurrent
                  ? TIER_COLORS[tier]
                  : "border-border hover:border-muted-foreground/30",
              )}
            >
              {isCurrent && (
                <span
                  className={cn(
                    "absolute -top-3 left-4 rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-wide",
                    TIER_BADGE_COLORS[tier],
                  )}
                >
                  {t("currentPlan")}
                </span>
              )}

              <div className="mb-4">
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide",
                    TIER_BADGE_COLORS[tier],
                  )}
                >
                  {t(`planNames.${tier}`)}
                </span>
              </div>

              <ul className="mt-2 flex-1 space-y-3 text-sm">
                <LimitRow
                  label={t("limits.messagesPerMonth")}
                  value={fmt(limits.messagesPerMonth)}
                />
                <LimitRow
                  label={t("limits.tokensPerMonth")}
                  value={fmt(limits.tokensPerMonth)}
                />
                <LimitRow
                  label={t("limits.chatsPerDay")}
                  value={fmt(limits.chatsPerDay)}
                />
                <LimitRow
                  label={t("limits.chatHistoryTotal")}
                  value={fmt(limits.chatHistoryTotal)}
                />
                <LimitRow
                  label={t("limits.knowledgeDocs")}
                  value={fmt(limits.knowledgeDocs)}
                />
                <LimitRow
                  label={t("limits.toolCallsPerMonth")}
                  value={fmt(limits.toolCallsPerMonth)}
                />
                <LimitRow
                  label={t("limits.widgetChatsPerDay")}
                  value={fmt(limits.widgetChatsPerDay)}
                />
                <LimitRow
                  label={t("limits.widgetToolsPerDay")}
                  value={fmt(limits.widgetToolsPerDay)}
                />
                <BoolRow
                  label={t("limits.nudgesEnabled")}
                  value={limits.nudgesEnabled}
                  yes={t("yes")}
                  no={t("no")}
                />
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LimitRow({ label, value }: { label: string; value: string }) {
  return (
    <li className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium tabular-nums">{value}</span>
    </li>
  );
}

function BoolRow({
  label,
  value,
  yes,
  no,
}: {
  label: string;
  value: boolean;
  yes: string;
  no: string;
}) {
  return (
    <li className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      {value ? (
        <span className="flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
          <Check className="size-3.5" aria-hidden="true" />
          {yes}
        </span>
      ) : (
        <span className="flex items-center gap-1 font-medium text-muted-foreground">
          <X className="size-3.5" aria-hidden="true" />
          {no}
        </span>
      )}
    </li>
  );
}
