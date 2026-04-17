/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

"use client";

import { Check, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { PLAN_LIMITS, PLAN_PRICES } from "@/types/billing";
import type { Tier } from "@/types/billing";

import { Separator } from "@/components/ui/separator";

const TIERS: Tier[] = ["free", "pro", "premium", "enterprise"];

function fmt(n: number): string {
  if (n === -1) return "∞";
  return n >= 1_000_000
    ? `${(n / 1_000_000).toFixed(1)}M`
    : n >= 1_000
      ? `${(n / 1_000).toFixed(0)}k`
      : String(n);
}

function fmtBytes(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)} MB`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)} KB`;
  return `${n} B`;
}

type PricingShellProps = {
  currentTier: Tier;
};

export function PricingShell({ currentTier }: PricingShellProps) {
  const t = useTranslations("pricing");

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("pageTitle")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("pageSubtitle")}
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {TIERS.map((tier) => {
          const limits = PLAN_LIMITS[tier];
          const price = PLAN_PRICES[tier];
          const isCurrent = tier === currentTier;

          return (
            <div key={tier} className="relative pt-3" data-tier={tier}>
              {isCurrent && (
                <span className="absolute top-0 left-4 -translate-y-1/2 rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-wide border border-tier-accent/30 bg-tier-accent/10 text-tier-accent">
                  {t("currentPlan")}
                </span>
              )}

              <div
                className={cn(
                  "flex h-full flex-col rounded-xl border-2 bg-card p-5 shadow-sm transition-shadow",
                  isCurrent
                    ? "border-tier-accent"
                    : "border-border hover:border-muted-foreground/30",
                )}
              >
                {/* Plan name */}
                <div className="mb-3">
                  <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide border border-tier-accent/30 bg-tier-accent/10 text-tier-accent">
                    {t(`planNames.${tier}`)}
                  </span>
                </div>

                {/* Price */}
                <div className="mb-4">
                  <div className="flex items-end gap-1">
                    <span className="text-3xl font-bold leading-none">
                      {price.monthly === 0
                        ? t("price.free")
                        : `€${price.monthly}`}
                    </span>
                    {price.monthly > 0 && (
                      <span className="mb-0.5 text-sm text-muted-foreground">
                        {t("price.perMonth")}
                      </span>
                    )}
                  </div>
                  {price.annual !== null ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t("price.annual", { price: price.annual })}
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-transparent select-none">
                      &nbsp;
                    </p>
                  )}
                </div>

                <Separator className="my-2" />

                {/* AI usage */}
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                  {t("sections.ai")}
                </p>
                <ul className="flex-1 space-y-2.5 text-sm">
                  <LimitRow
                    label={t("limits.messagesPerMonth")}
                    value={fmt(limits.messagesPerMonth)}
                  />
                  <LimitRow
                    label={t("limits.tokensPerMonth")}
                    value={fmt(limits.tokensPerMonth)}
                  />
                  <LimitRow
                    label={t("limits.toolCallsPerMonth")}
                    value={fmt(limits.toolCallsPerMonth)}
                  />
                  <BoolRow
                    label={t("limits.nudgesEnabled")}
                    value={limits.nudgesEnabled}
                    yes={t("yes")}
                    no={t("no")}
                  />
                </ul>

                {/* Data */}
                <Separator className="my-2" />
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                  {t("sections.data")}
                </p>
                <ul className="space-y-2.5 text-sm">
                  <LimitRow
                    label={t("limits.chatsPerDay")}
                    value={fmt(limits.chatsPerDay)}
                  />
                  <LimitRow
                    label={t("limits.chatHistoryTotal")}
                    value={fmt(limits.chatHistoryTotal)}
                  />
                  <LimitRow
                    label={t("limits.tasksMax")}
                    value={fmt(limits.tasksMax)}
                  />
                  <LimitRow
                    label={t("limits.meetingsMax")}
                    value={fmt(limits.meetingsMax)}
                  />
                  <LimitRow
                    label={t("limits.decisionsMax")}
                    value={fmt(limits.decisionsMax)}
                  />
                  <LimitRow
                    label={t("limits.contactsMax")}
                    value={fmt(limits.contactsMax)}
                  />
                  <LimitRow
                    label={t("limits.memoryMax")}
                    value={fmt(limits.memoryMax)}
                  />
                  <LimitRow
                    label={t("limits.knowledgeDocs")}
                    value={fmt(limits.knowledgeDocs)}
                  />
                  <LimitRow
                    label={t("limits.knowledgeFileSize")}
                    value={fmtBytes(limits.knowledgeFileSizeBytes)}
                  />
                </ul>

                {/* Widget */}
                <Separator className="my-2" />
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                  {t("sections.widget")}
                </p>
                <ul className="space-y-2.5 text-sm">
                  <LimitRow
                    label={t("limits.widgetChatsPerDay")}
                    value={fmt(limits.widgetChatsPerDay)}
                  />
                  <LimitRow
                    label={t("limits.widgetToolsPerDay")}
                    value={fmt(limits.widgetToolsPerDay)}
                  />
                </ul>
              </div>
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
