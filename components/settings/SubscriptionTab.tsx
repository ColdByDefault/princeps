/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version beta
 * @since beta
 * @module
 * @description
 */

"use client";

import { useState } from "react";
import { Check, X, Loader2, ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { PLAN_LIMITS, PLAN_PRICES } from "@/types/billing";
import { Button, buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { Tier } from "@/types/billing";

// ─── Helpers ─────────────────────────────────────────────

const UPGRADEABLE: Tier[] = ["pro", "premium"];

function annualSavingsPercent(tier: "pro" | "premium"): number {
  const p = PLAN_PRICES[tier];
  if (!p.annual || p.monthly === 0) return 0;
  return Math.round(((p.monthly * 12 - p.annual) / (p.monthly * 12)) * 100);
}

function fmt(n: number): string {
  if (n === -1) return "∞";
  return n >= 1_000_000
    ? `${(n / 1_000_000).toFixed(1)}M`
    : n >= 1_000
      ? `${(n / 1_000).toFixed(0)}k`
      : String(n);
}

// ─── Props ───────────────────────────────────────────────

type Props = {
  currentTier: Tier;
  appOrigin: string;
  priceIds: {
    proMonthly: string;
    proAnnual: string;
    premiumMonthly: string;
    premiumAnnual: string;
  };
};

// ─── Component ───────────────────────────────────────────

export function SubscriptionTab({ currentTier, appOrigin, priceIds }: Props) {
  const t = useTranslations("settings.subscription");
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
  const [loadingPortal, setLoadingPortal] = useState(false);
  const [loadingTier, setLoadingTier] = useState<Tier | null>(null);

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

  async function handleManage() {
    setLoadingPortal(true);
    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ returnUrl: `${appOrigin}/settings` }),
      });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { url: string };
      window.location.href = data.url;
    } catch {
      toast.error(t("portalError"));
      setLoadingPortal(false);
    }
  }

  async function handleSubscribe(tier: "pro" | "premium") {
    const priceId =
      billing === "monthly"
        ? priceIdMap[tier].monthly
        : priceIdMap[tier].annual;
    if (!priceId) {
      toast.error(t("error"));
      return;
    }
    setLoadingTier(tier);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceId,
          successUrl: `${appOrigin}/onboarding/success`,
          cancelUrl: `${appOrigin}/settings`,
        }),
      });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { url: string };
      window.location.href = data.url;
    } catch {
      toast.error(t("error"));
      setLoadingTier(null);
    }
  }

  return (
    <div className="space-y-8">
      {/* Current plan */}
      <section>
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
          {t("currentPlan")}
        </h3>
        <div className="flex items-center gap-3">
          <span
            data-tier={currentTier}
            className="rounded-full px-3 py-1 text-sm font-semibold tracking-wide border border-tier-accent/30 bg-tier-accent/10 text-tier-accent"
          >
            {currentTier.charAt(0).toUpperCase() + currentTier.slice(1)}
          </span>
        </div>
      </section>

      <Separator />

      {/* Paid user — show portal button */}
      {currentTier !== "free" && currentTier !== "enterprise" && (
        <section>
          <h3 className="text-sm font-semibold mb-1">{t("managePlan")}</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {t("manageDescription")}
          </p>
          <Button
            onClick={handleManage}
            disabled={loadingPortal}
            className="cursor-pointer"
          >
            {loadingPortal ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("managing")}
              </>
            ) : (
              <>
                <ExternalLink className="mr-2 h-4 w-4" />
                {t("managePlan")}
              </>
            )}
          </Button>
        </section>
      )}

      {/* Free user — show upgrade cards */}
      {currentTier === "free" && (
        <section>
          <h3 className="text-sm font-semibold mb-1">{t("upgradeTitle")}</h3>
          <p className="text-sm text-muted-foreground mb-6">
            {t("upgradeDescription")}
          </p>

          {/* Billing toggle */}
          <div className="mb-6 flex">
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

          <div className="grid gap-4 sm:grid-cols-2">
            {(UPGRADEABLE as Array<"pro" | "premium">).map((tier) => {
              const limits = PLAN_LIMITS[tier];
              const price = PLAN_PRICES[tier];
              const isLoading = loadingTier === tier;
              const savings = annualSavingsPercent(tier);

              const displayPrice =
                billing === "annual" ? (price.annual ?? 0) / 12 : price.monthly;

              return (
                <div
                  key={tier}
                  data-tier={tier}
                  className="rounded-xl border-2 border-border bg-card p-5 shadow-sm"
                >
                  <div className="mb-3">
                    <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide border border-tier-accent/30 bg-tier-accent/10 text-tier-accent">
                      {tier.charAt(0).toUpperCase() + tier.slice(1)}
                    </span>
                  </div>

                  <div className="mb-1 flex items-end gap-1">
                    <span className="text-2xl font-bold leading-none">
                      €
                      {displayPrice % 1 === 0
                        ? displayPrice.toFixed(0)
                        : displayPrice.toFixed(2)}
                    </span>
                    <span className="mb-0.5 text-sm text-muted-foreground">
                      {t("perMonth")}
                    </span>
                  </div>

                  {billing === "annual" && savings > 0 && (
                    <p className="mb-4 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                      {t("annualSavings", { percent: savings })}
                    </p>
                  )}

                  <ul className="mb-5 mt-3 space-y-1.5 text-sm">
                    <LimitRow
                      label="Messages / month"
                      value={fmt(limits.messagesPerMonth)}
                    />
                    <LimitRow
                      label="Contacts"
                      value={fmt(limits.contactsMax)}
                    />
                    <LimitRow label="Tasks" value={fmt(limits.tasksMax)} />
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

                  <Button
                    className="w-full cursor-pointer"
                    disabled={!!loadingTier}
                    onClick={() => handleSubscribe(tier)}
                    aria-label={t("subscribeAriaLabel", { tier })}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t("subscribing")}
                      </>
                    ) : (
                      t("subscribeCta")
                    )}
                  </Button>
                </div>
              );
            })}
          </div>

          {/* Enterprise contact */}
          <div className="mt-4 rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <span
                  data-tier="enterprise"
                  className="rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide border border-tier-accent/30 bg-tier-accent/10 text-tier-accent"
                >
                  {t("enterpriseName")}
                </span>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("enterprisePriceLabel")}
                </p>
              </div>
              <a
                href="mailto:hello@princeps.app"
                className={buttonVariants({
                  variant: "outline",
                  className: "cursor-pointer",
                })}
              >
                {t("enterpriseCta")}
              </a>
            </div>
          </div>
        </section>
      )}
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
