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
          ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
          : tier === "premium"
            ? "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300"
            : tier === "enterprise"
              ? "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300"
              : "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
      )}
    >
      {label}
    </span>
  );
}
