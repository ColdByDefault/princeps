/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { TIER_BADGE_COLORS } from "@/lib/tiers/colors";

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

  const colorClass =
    TIER_BADGE_COLORS[tier as keyof typeof TIER_BADGE_COLORS] ??
    TIER_BADGE_COLORS.free;

  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[10px] font-medium tracking-wide",
        colorClass,
      )}
    >
      {label}
    </span>
  );
}
