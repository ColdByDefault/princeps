/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import type { Tier } from "@/types/billing";

/** Badge background + text — used in PlanBadge and PricingShell */
export const TIER_BADGE_COLORS: Record<Tier, string> = {
  free: "bg-slate-900 text-slate-400 dark:bg-slate-950 dark:text-slate-500",
  pro: "bg-blue-950 text-blue-300 dark:bg-blue-950/50 dark:text-blue-400",
  premium:
    "bg-purple-950 text-purple-300 dark:bg-purple-950/50 dark:text-purple-400",
  enterprise:
    "bg-zinc-800 text-amber-200 dark:bg-zinc-900 dark:text-amber-500/80",
};

/** Card border — used in PricingShell */
export const TIER_CARD_COLORS: Record<Tier, string> = {
  free: "border-slate-800 dark:border-slate-900",
  pro: "border-blue-900 dark:border-blue-800/50",
  premium: "border-purple-900 dark:border-purple-800/50",
  enterprise: "border-zinc-700 dark:border-zinc-800",
};

/** Avatar ring — used in Navbar-Desktop */
export const TIER_RING_COLORS: Record<Tier, string> = {
  free: "ring-slate-800 dark:ring-slate-700",
  pro: "ring-blue-800 dark:ring-blue-700",
  premium: "ring-purple-800 dark:ring-purple-700",
  enterprise: "ring-amber-900 dark:ring-amber-700/50",
};
