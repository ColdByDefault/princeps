/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import ThemeToggle from "@/components/theme/ThemeToggle";
import { LanguageToggle } from "@/components/shared";
import { Switch } from "@/components/ui/switch";

type AppearanceTabProps = {
  initialNotificationsEnabled: boolean;
};

export function AppearanceTab({
  initialNotificationsEnabled,
}: AppearanceTabProps) {
  const t = useTranslations("settings.appearance");
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    initialNotificationsEnabled,
  );
  const [saving, setSaving] = useState(false);

  async function handleNotificationsToggle(checked: boolean) {
    setSaving(true);
    setNotificationsEnabled(checked);
    try {
      await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationsEnabled: checked }),
      });
    } finally {
      setSaving(false);
    }
  }

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

      <div className="flex items-center justify-between gap-4 py-4">
        <div className="space-y-0.5">
          <p className="text-sm font-medium">{t("notificationsTitle")}</p>
          <p className="text-sm text-muted-foreground">
            {t("notificationsDescription")}
          </p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            {t("notificationsDisclaimer")}
          </p>
        </div>
        <Switch
          checked={notificationsEnabled}
          onCheckedChange={handleNotificationsToggle}
          disabled={saving}
          aria-label={t("notificationsTitle")}
          className="cursor-pointer"
        />
      </div>
    </div>
  );
}
