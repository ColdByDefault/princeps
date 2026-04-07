/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

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
      className={cn(
        "rounded-full px-2 py-0.5 text-[10px] font-medium tracking-wide",
        tier === "free"
          ? "bg-gray-100 text-gray-600 dark:bg-gray-800/40 dark:text-gray-400"
          : tier === "premium"
            ? "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300"
            : tier === "enterprise"
              ? "bg-zinc-200 text-zinc-700 dark:bg-zinc-800/40 dark:text-zinc-300"
              : "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
      )}
    >
      {label}
    </span>
  );
}
