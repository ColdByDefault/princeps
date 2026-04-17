/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * SPDX-License-Identifier: Elastic-2.0
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { PLAN_LIMITS, PLAN_PRICES } from "@/types/billing";
import { Button, buttonVariants } from "@/components/ui/button";
import type { Tier } from "@/types/billing";

// ─── Constants ───────────────────────────────────────────

const PAID_TIERS: Tier[] = ["pro", "premium"];
const ALL_TIERS: Tier[] = ["free", "pro", "premium", "enterprise"];

export type PlanPriceIds = {
  proMonthly: string;
  proAnnual: string;
  premiumMonthly: string;
  premiumAnnual: string;
};

function annualSavingsPercent(tier: "pro" | "premium"): number {
  const p = PLAN_PRICES[tier];
  if (!p.annual || p.monthly === 0) return 0;
  const monthly12 = p.monthly * 12;
  return Math.round(((monthly12 - p.annual) / monthly12) * 100);
}

function fmt(n: number): string {
  if (n === -1) return "∞";
  return n >= 1_000_000
    ? `${(n / 1_000_000).toFixed(1)}M`
    : n >= 1_000
      ? `${(n / 1_000).toFixed(0)}k`
      : String(n);
}

// ─── Component ───────────────────────────────────────────

type Props = {
  /** Where to land after free selection or post-checkout. */
  successPath: string;
  /** Where Stripe sends the user if they click back during checkout. */
  cancelPath: string;
  /** Origin used to build absolute URLs for Stripe. */
  appOrigin: string;
  /** Stripe price IDs passed from the server page. */
  priceIds: PlanPriceIds;
};

export function PlanPickerShell({
  successPath,
  cancelPath,
  appOrigin,
  priceIds,
}: Props) {
  const t = useTranslations("onboarding.plan");
  const router = useRouter();
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
  const [loading, setLoading] = useState<string | null>(null); // tier being processed

  const priceIdMap: Record<
    "pro" | "premium",
    { monthly: string; annual: string }
  > = {
    pro: { monthly: priceIds.proMonthly, annual: priceIds.proAnnual },
    premium: {
      monthly: priceIds.premiumMonthly,
      annual: priceIds.premiumAnnual,
    },
  };

  async function handleSubscribe(tier: "pro" | "premium") {
    const priceId =
      billing === "monthly"
        ? priceIdMap[tier].monthly
        : priceIdMap[tier].annual;

    if (!priceId) {
      toast.error(t("error"));
      return;
    }

    setLoading(tier);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceId,
          successUrl: `${appOrigin}${successPath}`,
          cancelUrl: `${appOrigin}${cancelPath}`,
        }),
      });
      if (!res.ok) throw new Error("checkout failed");
      const data = (await res.json()) as { url: string };
      window.location.href = data.url;
    } catch {
      toast.error(t("error"));
      setLoading(null);
    }
  }

  function handleFree() {
    router.push(successPath);
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      {/* Billing toggle */}
      <div className="mb-8 flex justify-center">
        <div className="inline-flex rounded-full border border-border bg-muted p-1 text-sm">
          <button
            onClick={() => setBilling("monthly")}
            className={cn(
              "rounded-full px-4 py-1.5 font-medium transition-colors cursor-pointer",
              billing === "monthly"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t("billingMonthly")}
          </button>
          <button
            onClick={() => setBilling("annual")}
            className={cn(
              "rounded-full px-4 py-1.5 font-medium transition-colors cursor-pointer",
              billing === "annual"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t("billingAnnual")}
          </button>
        </div>
      </div>

      {/* Plan cards */}
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {ALL_TIERS.map((tier) => {
          const limits = PLAN_LIMITS[tier];
          const price = PLAN_PRICES[tier];
          const isPaid = PAID_TIERS.includes(tier as "pro" | "premium");
          const isEnterprise = tier === "enterprise";
          const isFree = tier === "free";
          const isLoading = loading === tier;

          const displayPrice =
            isPaid && billing === "annual"
              ? (PLAN_PRICES[tier as "pro" | "premium"].annual ?? 0) / 12
              : price.monthly;

          const savings = isPaid
            ? annualSavingsPercent(tier as "pro" | "premium")
            : 0;

          return (
            <div
              key={tier}
              data-tier={tier}
              className="flex flex-col rounded-xl border-2 border-border bg-card p-5 shadow-sm transition-shadow hover:border-muted-foreground/30"
            >
              {/* Plan badge + price */}
              <div className="mb-4">
                <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide border border-tier-accent/30 bg-tier-accent/10 text-tier-accent">
                  {tier.charAt(0).toUpperCase() + tier.slice(1)}
                </span>

                <div className="mt-3 flex items-end gap-1">
                  {isFree ? (
                    <span className="text-3xl font-bold leading-none">
                      Free
                    </span>
                  ) : isEnterprise ? (
                    <span className="text-xl font-bold leading-none">
                      Custom
                    </span>
                  ) : (
                    <>
                      <span className="text-3xl font-bold leading-none">
                        €
                        {displayPrice % 1 === 0
                          ? displayPrice.toFixed(0)
                          : displayPrice.toFixed(2)}
                      </span>
                      <span className="mb-0.5 text-sm text-muted-foreground">
                        {billing === "annual" ? t("perYear") : t("perMonth")}
                      </span>
                    </>
                  )}
                </div>

                {isPaid && billing === "annual" && savings > 0 && (
                  <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    {t("annualSavings", { percent: savings })}
                  </p>
                )}
              </div>

              {/* Key limits */}
              <ul className="mb-6 flex-1 space-y-2 text-sm">
                <LimitRow
                  label="Messages / month"
                  value={fmt(limits.messagesPerMonth)}
                />
                <LimitRow
                  label="Chats saved"
                  value={fmt(limits.chatHistoryTotal)}
                />
                <LimitRow label="Contacts" value={fmt(limits.contactsMax)} />
                <LimitRow label="Tasks" value={fmt(limits.tasksMax)} />
                <LimitRow label="Meetings" value={fmt(limits.meetingsMax)} />
                <LimitRow
                  label="Knowledge docs"
                  value={fmt(limits.knowledgeDocs)}
                />
                <LimitRow
                  label="Proactive nudges"
                  value={
                    limits.nudgesEnabled ? (
                      <Check className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <X className="h-4 w-4 text-muted-foreground" />
                    )
                  }
                />
              </ul>

              {/* CTA */}
              {isFree && (
                <Button
                  variant="outline"
                  className="w-full cursor-pointer"
                  onClick={handleFree}
                >
                  {t("free.cta")}
                </Button>
              )}

              {isPaid && (
                <Button
                  className="w-full cursor-pointer"
                  disabled={!!loading}
                  onClick={() => handleSubscribe(tier as "pro" | "premium")}
                  aria-label={`Subscribe to ${tier}`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t("paid.subscribing")}
                    </>
                  ) : (
                    t("paid.cta")
                  )}
                </Button>
              )}

              {isEnterprise && (
                /* use next Link */
                <Link
                  href="mailto:hello@princeps.app"
                  className={buttonVariants({
                    variant: "outline",
                    className: "w-full cursor-pointer",
                  })}
                >
                  {t("enterprise.cta")}
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Helper ──────────────────────────────────────────────

function LimitRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <li className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </li>
  );
}
