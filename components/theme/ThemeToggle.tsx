/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

"use client";

import { useSyncExternalStore } from "react";
import { LaptopMinimal, Moon, Sun, type LucideIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { getMessage } from "@/lib/i18n";
import { cn } from "@/lib/utils";
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

  return (
    <div
      role="group"
      aria-label={groupLabel}
      className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-background/70 p-1 backdrop-blur-sm"
    >
      {options.map((option) => {
        const Icon = option.icon;
        const label = getMessage(messages, option.labelKey, option.fallback);
        const isActive = activeTheme === option.value;

        return (
          <Button
            key={option.value}
            type="button"
            size="icon-xs"
            variant={isActive ? "default" : "ghost"}
            aria-label={label}
            aria-pressed={isActive}
            title={label}
            onClick={() => setTheme(option.value)}
            className={cn(
              "rounded-full",
              !isActive && "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="size-3.5" />
          </Button>
        );
      })}
    </div>
  );
}
