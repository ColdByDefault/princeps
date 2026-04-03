/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

"use client";

import { useTranslations } from "next-intl";
import ThemeToggle from "@/components/theme/ThemeToggle";
import { LanguageToggle } from "@/components/shared";

export function AppearanceTab() {
  const t = useTranslations("settings.appearance");

  return (
    <div className="divide-y divide-border/60">
      <div className="flex items-center justify-between gap-4 py-4">
        <div className="space-y-0.5">
          <p className="text-sm font-medium">{t("themeTitle")}</p>
          <p className="text-sm text-muted-foreground">
            {t("themeDescription")}
          </p>
        </div>
        <ThemeToggle />
      </div>

      <div className="flex items-center justify-between gap-4 py-4">
        <div className="space-y-0.5">
          <p className="text-sm font-medium">{t("languageTitle")}</p>
          <p className="text-sm text-muted-foreground">
            {t("languageDescription")}
          </p>
        </div>
        <LanguageToggle />
      </div>
    </div>
  );
}
