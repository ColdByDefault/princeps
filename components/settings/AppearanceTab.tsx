/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import ThemeToggle from "@/components/theme/ThemeToggle";
import { LanguageToggle } from "@/components/shared";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TIMEZONE_OPTIONS_BY_REGION,
  TIMEZONE_REGIONS,
} from "@/lib/weather/timezone-list";

type AppearanceTabProps = {
  initialNotificationsEnabled: boolean;
  initialTimezone: string;
};

export function AppearanceTab({
  initialNotificationsEnabled,
  initialTimezone,
}: AppearanceTabProps) {
  const t = useTranslations("settings.appearance");
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    initialNotificationsEnabled,
  );
  const [savingNotifications, setSavingNotifications] = useState(false);
  const [timezone, setTimezone] = useState(initialTimezone);
  const [savingTimezone, setSavingTimezone] = useState(false);

  async function handleNotificationsToggle(checked: boolean) {
    setSavingNotifications(true);
    setNotificationsEnabled(checked);
    try {
      await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationsEnabled: checked }),
      });
    } finally {
      setSavingNotifications(false);
    }
  }

  async function handleTimezoneChange(value: string | null) {
    if (!value) return;
    setTimezone(value);
    setSavingTimezone(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timezone: value }),
      });
      if (!res.ok) {
        toast.error(t("timezoneSaveFailed"));
      } else {
        toast.success(t("timezoneSaved"));
      }
    } catch {
      toast.error(t("timezoneSaveFailed"));
    } finally {
      setSavingTimezone(false);
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

      <div className="flex items-start justify-between gap-4 py-4">
        <div className="space-y-0.5">
          <p className="text-sm font-medium">{t("timezoneTitle")}</p>
          <p className="text-sm text-muted-foreground">
            {t("timezoneDescription")}
          </p>
        </div>
        <Select
          value={timezone}
          onValueChange={handleTimezoneChange}
          disabled={savingTimezone}
        >
          <SelectTrigger
            className="w-48 cursor-pointer"
            aria-label={t("timezoneTitle")}
          >
            <SelectValue placeholder={t("timezonePlaceholder")} />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            {TIMEZONE_REGIONS.map((region) => (
              <SelectGroup key={region}>
                <SelectLabel>{region}</SelectLabel>
                {TIMEZONE_OPTIONS_BY_REGION[region]?.map((opt) => (
                  <SelectItem
                    key={opt.value}
                    value={opt.value}
                    className="cursor-pointer"
                  >
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
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
          disabled={savingNotifications}
          aria-label={t("notificationsTitle")}
          className="cursor-pointer"
        />
      </div>
    </div>
  );
}
