/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import type { Tier } from "@/types/billing";

/** Badge background + text — used in PlanBadge and PricingShell */
export const TIER_BADGE_COLORS: Record<Tier, string> = {
  free: "bg-gray-100 text-gray-600 dark:bg-gray-800/40 dark:text-gray-400",
  pro: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  premium:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  enterprise:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
};

/** Card border — used in PricingShell */
export const TIER_CARD_COLORS: Record<Tier, string> = {
  free: "border-gray-300 dark:border-gray-600",
  pro: "border-blue-400 dark:border-blue-600",
  premium: "border-purple-400 dark:border-purple-600",
  enterprise: "border-amber-400 dark:border-amber-600",
};

/** Avatar ring — used in Navbar-Desktop */
export const TIER_RING_COLORS: Record<Tier, string> = {
  free: "ring-gray-400 dark:ring-gray-400",
  pro: "ring-blue-500 dark:ring-blue-400",
  premium: "ring-purple-500 dark:ring-purple-400",
  enterprise: "ring-amber-500 dark:ring-amber-400",
};
