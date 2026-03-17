/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

"use client";

import { useSyncExternalStore } from "react";
import { LaptopMinimal, Moon, Sun, type LucideIcon } from "lucide-react";
import { useTheme } from "next-themes";
import SegmentedControl from "@/components/shared/SegmentedControl";
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

  const segmentedOptions = options.map((option) => {
    const Icon = option.icon;
    const label = getMessage(messages, option.labelKey, option.fallback);

    return {
      ariaLabel: label,
      content: <Icon className="size-3.5" />,
      title: label,
      value: option.value,
    };
  });

  return (
    <SegmentedControl
      activeClassName="shadow-sm"
      groupLabel={groupLabel}
      inactiveClassName="text-muted-foreground"
      onChange={setTheme}
      optionClassName={cn("rounded-full")}
      options={segmentedOptions}
      size="icon-xs"
      value={activeTheme}
    />
  );
}
