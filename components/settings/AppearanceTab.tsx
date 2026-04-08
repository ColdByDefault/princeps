/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Check, ChevronsUpDown } from "lucide-react";
import ThemeToggle from "@/components/theme/ThemeToggle";
import { LanguageToggle, CustomToggle } from "@/components/shared";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  TIMEZONE_OPTIONS,
  LOCATION_OPTIONS,
  LOCATION_OPTIONS_BY_COUNTRY,
  LOCATION_COUNTRIES,
} from "@/lib/weather";

type AppearanceTabProps = {
  initialNotificationsEnabled: boolean;
  initialTimezone: string;
  initialLocation: string | null;
};

export function AppearanceTab({
  initialNotificationsEnabled,
  initialTimezone,
  initialLocation,
}: AppearanceTabProps) {
  const t = useTranslations("settings.appearance");
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    initialNotificationsEnabled,
  );
  const [savingNotifications, setSavingNotifications] = useState(false);
  const [timezone, setTimezone] = useState(initialTimezone);
  const [savingTimezone, setSavingTimezone] = useState(false);
  const [timezoneOpen, setTimezoneOpen] = useState(false);
  const [location, setLocation] = useState(initialLocation ?? "");
  const [savingLocation, setSavingLocation] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);

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

  async function handleTimezoneChange(value: string) {
    setTimezone(value);
    setTimezoneOpen(false);
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

  async function handleLocationChange(value: string) {
    setLocation(value);
    setLocationOpen(false);
    setSavingLocation(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location: value }),
      });
      if (!res.ok) {
        toast.error(t("locationSaveFailed"));
      } else {
        toast.success(t("locationSaved"));
      }
    } catch {
      toast.error(t("locationSaveFailed"));
    } finally {
      setSavingLocation(false);
    }
  }

  const selectedTimezoneLabel =
    TIMEZONE_OPTIONS.find((o) => o.value === timezone)?.label ??
    t("timezonePlaceholder");

  const selectedLocationLabel =
    LOCATION_OPTIONS.find((o) => o.value === location)?.label ??
    t("locationPlaceholder");

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
          <p className="text-sm font-medium">{t("locationTitle")}</p>
          <p className="text-sm text-muted-foreground">
            {t("locationDescription")}
          </p>
        </div>
        <Popover open={locationOpen} onOpenChange={setLocationOpen}>
          <PopoverTrigger
            render={
              <Button
                variant="outline"
                aria-label={t("locationTitle")}
                disabled={savingLocation}
                className="w-48 justify-between cursor-pointer font-normal"
              />
            }
          >
            <span className="truncate">{selectedLocationLabel}</span>
            <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
          </PopoverTrigger>
          <PopoverContent className="w-64 p-0" align="end">
            <Command>
              <CommandInput placeholder={t("locationSearchPlaceholder")} />
              <CommandList>
                <CommandEmpty>{t("locationEmpty")}</CommandEmpty>
                {LOCATION_COUNTRIES.map((country) => (
                  <CommandGroup key={country} heading={country}>
                    {LOCATION_OPTIONS_BY_COUNTRY[country]?.map((opt) => (
                      <CommandItem
                        key={opt.value}
                        value={opt.label}
                        onSelect={() => handleLocationChange(opt.value)}
                        className="cursor-pointer"
                      >
                        <Check
                          className={cn(
                            "mr-2 size-4",
                            location === opt.value
                              ? "opacity-100"
                              : "opacity-0",
                          )}
                        />
                        {opt.label}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                ))}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex items-start justify-between gap-4 py-4">
        <div className="space-y-0.5">
          <p className="text-sm font-medium">{t("timezoneTitle")}</p>
          <p className="text-sm text-muted-foreground">
            {t("timezoneDescription")}
          </p>
        </div>
        <Popover open={timezoneOpen} onOpenChange={setTimezoneOpen}>
          <PopoverTrigger
            render={
              <Button
                variant="outline"
                aria-label={t("timezoneTitle")}
                disabled={savingTimezone}
                className="w-64 justify-between cursor-pointer font-normal"
              />
            }
          >
            <span className="truncate">{selectedTimezoneLabel}</span>
            <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="end">
            <Command>
              <CommandInput placeholder={t("timezoneSearchPlaceholder")} />
              <CommandList>
                <CommandEmpty>{t("timezoneEmpty")}</CommandEmpty>
                <CommandGroup>
                  {TIMEZONE_OPTIONS.map((opt) => (
                    <CommandItem
                      key={opt.value}
                      value={opt.label}
                      onSelect={() => handleTimezoneChange(opt.value)}
                      className="cursor-pointer"
                    >
                      <Check
                        className={cn(
                          "mr-2 size-4",
                          timezone === opt.value ? "opacity-100" : "opacity-0",
                        )}
                      />
                      {opt.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
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
        <CustomToggle
          checked={notificationsEnabled}
          onCheckedChange={handleNotificationsToggle}
          disabled={savingNotifications}
          aria-label={t("notificationsTitle")}
        />
      </div>
    </div>
  );
}
