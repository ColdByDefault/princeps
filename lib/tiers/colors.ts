/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import type { Tier } from "@/types/billing";

/** Badge background + text — used in PlanBadge and PricingShell */
export const TIER_BADGE_COLORS: Record<Tier, string> = {
  free: "bg-gray-100 text-gray-600 dark:bg-gray-800/40 dark:text-gray-400",
  pro: "bg-gray-300 text-blue-700 dark:bg-gray-700/40 dark:text-gray-300",
  premium: "bg-gray-400 text-purple-700 dark:bg-gray-600/40 dark:text-gray-200",
  enterprise:
    "bg-gray-600 text-amber-700 dark:bg-gray-500/40 dark:text-gray-100",
};

/** Card border — used in PricingShell */
export const TIER_CARD_COLORS: Record<Tier, string> = {
  free: "border-gray-300 dark:border-gray-600",
  pro: "border-gray-400 dark:border-gray-500",
  premium: "border-gray-500 dark:border-gray-400",
  enterprise: "border-gray-600 dark:border-gray-300",
};

/** Avatar ring — used in Navbar-Desktop */
export const TIER_RING_COLORS: Record<Tier, string> = {
  free: "ring-gray-400 dark:ring-gray-400",
  pro: "ring-gray-400 dark:ring-gray-300",
  premium: "ring-gray-500 dark:ring-gray-200",
  enterprise: "ring-gray-600 dark:ring-gray-100",
};
