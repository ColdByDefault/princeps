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

import { useTranslations } from "next-intl";

export function PlanBadge({ tier }: { tier: string }) {
  const t = useTranslations("shell.nav");
  const label =
    tier === "pro"
      ? t("planPro")
      : tier === "premium"
        ? t("planPremium")
        : tier === "enterprise"
          ? t("planEnterprise")
          : t("planFree");

  return (
    <span
      data-tier={tier}
      className="rounded-full px-2 py-0.5 text-[10px] font-medium tracking-wide border border-tier-accent/30 bg-tier-accent/10 text-tier-accent"
    >
      {label}
    </span>
  );
}
