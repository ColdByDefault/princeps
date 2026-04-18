/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * SPDX-License-Identifier: Elastic-2.0
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
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
import { TIMEZONE_OPTIONS } from "@/lib/weather/timezone-list";

interface GeocodeSuggestion {
  id: number;
  name: string;
  country: string;
  admin1: string | null;
  latitude: number;
  longitude: number;
}

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

  // Location — stores the display label of the saved city
  const [locationLabel, setLocationLabel] = useState(initialLocation ?? "");
  const [locationOpen, setLocationOpen] = useState(false);
  const [locationSearch, setLocationSearch] = useState("");
  const [suggestions, setSuggestions] = useState<GeocodeSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [savingLocation, setSavingLocation] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced geocode search — fires 400 ms after the user stops typing
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (locationSearch.trim().length < 2) {
      setSuggestions([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/weather/geocode?q=${encodeURIComponent(locationSearch.trim())}`,
        );
        if (res.ok) {
          const data = (await res.json()) as { results: GeocodeSuggestion[] };
          setSuggestions(data.results ?? []);
        }
      } catch {
        // Non-critical — silently ignore network errors
      } finally {
        setSearching(false);
      }
    }, 400);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [locationSearch]);

  function handleLocationOpenChange(open: boolean) {
    setLocationOpen(open);
    if (!open) {
      setLocationSearch("");
      setSuggestions([]);
      setSearching(false);
    }
  }

  async function handleLocationSelect(suggestion: GeocodeSuggestion) {
    const label = suggestion.admin1
      ? `${suggestion.name}, ${suggestion.admin1}, ${suggestion.country}`
      : `${suggestion.name}, ${suggestion.country}`;

    setLocationLabel(label);
    handleLocationOpenChange(false);
    setSavingLocation(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location: label,
          locationLat: suggestion.latitude,
          locationLon: suggestion.longitude,
        }),
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

  const selectedTimezoneLabel =
    TIMEZONE_OPTIONS.find((o) => o.value === timezone)?.label ??
    t("timezonePlaceholder");

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
        <Popover open={locationOpen} onOpenChange={handleLocationOpenChange}>
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
            <span className="truncate">
              {locationLabel || t("locationPlaceholder")}
            </span>
            {savingLocation ? (
              <Loader2 className="ml-2 size-4 shrink-0 animate-spin opacity-50" />
            ) : (
              <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
            )}
          </PopoverTrigger>
          <PopoverContent className="w-72 p-0" align="end">
            <Command shouldFilter={false}>
              <CommandInput
                placeholder={t("locationSearchPlaceholder")}
                value={locationSearch}
                onValueChange={setLocationSearch}
              />
              <CommandList>
                {searching && (
                  <div className="flex items-center justify-center gap-2 py-3 text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" />
                    {t("locationSearching")}
                  </div>
                )}
                {!searching &&
                  locationSearch.trim().length >= 2 &&
                  suggestions.length === 0 && (
                    <CommandEmpty>{t("locationEmpty")}</CommandEmpty>
                  )}
                {!searching && suggestions.length > 0 && (
                  <CommandGroup>
                    {suggestions.map((s) => {
                      const label = s.admin1
                        ? `${s.name}, ${s.admin1}, ${s.country}`
                        : `${s.name}, ${s.country}`;
                      return (
                        <CommandItem
                          key={s.id}
                          value={label}
                          onSelect={() => handleLocationSelect(s)}
                          className="cursor-pointer"
                        >
                          <Check
                            className={cn(
                              "mr-2 size-4 shrink-0",
                              locationLabel === label
                                ? "opacity-100"
                                : "opacity-0",
                            )}
                          />
                          <span className="truncate">{label}</span>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                )}
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
