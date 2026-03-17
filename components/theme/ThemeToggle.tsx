/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

"use client";

import { useSyncExternalStore } from "react";
import { LaptopMinimal, Moon, Sun, type LucideIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getMessage } from "@/lib/i18n";
import { type MessageDictionary } from "@/types/i18n";

type ThemeOption = {
  value: "light" | "dark" | "system";
  icon: LucideIcon;
  labelKey: string;
  fallback: string;
};

const options: ReadonlyArray<ThemeOption> = [
  {
    value: "light",
    icon: Sun,
    labelKey: "theme.selector.light",
    fallback: "Light theme",
  },
  {
    value: "dark",
    icon: Moon,
    labelKey: "theme.selector.dark",
    fallback: "Dark theme",
  },
  {
    value: "system",
    icon: LaptopMinimal,
    labelKey: "theme.selector.system",
    fallback: "System theme",
  },
];

export default function ThemeToggle({
  messages,
}: {
  messages: MessageDictionary;
}) {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const activeTheme = mounted ? (theme ?? "system") : "system";

  const groupLabel = getMessage(
    messages,
    "theme.selector.groupLabel",
    "Theme selector",
  );
  const activeOption =
    options.find((option) => option.value === activeTheme) ?? options[2];
  const ActiveIcon = activeOption.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-label={groupLabel}
            className="cursor-pointer rounded-full border-border/70 bg-background/70 px-3 backdrop-blur-sm"
          >
            <ActiveIcon className="size-3.5" />
            {getMessage(messages, activeOption.labelKey, activeOption.fallback)}
          </Button>
        }
      />
      <DropdownMenuContent
        align="end"
        className="min-w-40 rounded-2xl border-border/70 bg-background/92 backdrop-blur-xl"
      >
        {options.map((option) => {
          const label = getMessage(messages, option.labelKey, option.fallback);

          return (
            <DropdownMenuItem
              key={option.value}
              className="cursor-pointer rounded-xl"
              onClick={() => setTheme(option.value)}
            >
              <span className="flex w-full items-center justify-between gap-3">
                <span className="inline-flex items-center gap-2">
                  <option.icon className="size-3.5" />
                  {label}
                </span>
                {activeTheme === option.value ? (
                  <span className="text-xs text-muted-foreground">
                    {getMessage(messages, "theme.selector.current", "Current")}
                  </span>
                ) : null}
              </span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
