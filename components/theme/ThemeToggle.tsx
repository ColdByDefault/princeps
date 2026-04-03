/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

"use client";

import { useSyncExternalStore } from "react";
import { LaptopMinimal, Moon, Sun, type LucideIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenuButton } from "@/components/ui/sidebar";

type ThemeOption = {
  value: "light" | "dark" | "system";
  icon: LucideIcon;
  labelKey: "selector.light" | "selector.dark" | "selector.system";
};

const options: ReadonlyArray<ThemeOption> = [
  { value: "light", icon: Sun, labelKey: "selector.light" },
  { value: "dark", icon: Moon, labelKey: "selector.dark" },
  { value: "system", icon: LaptopMinimal, labelKey: "selector.system" },
];

export default function ThemeToggle({
  collapsed = false,
}: {
  collapsed?: boolean;
}) {
  const t = useTranslations("theme");
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const activeTheme = mounted ? (theme ?? "system") : "system";

  const groupLabel = t("selector.groupLabel");
  const activeOption =
    options.find((option) => option.value === activeTheme) ?? options[2];
  const ActiveIcon = activeOption.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          collapsed ? (
            <SidebarMenuButton
              className="cursor-pointer"
              tooltip={t(activeOption.labelKey)}
            >
              <ActiveIcon className="size-3.5" />
            </SidebarMenuButton>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              aria-label={groupLabel}
              className="cursor-pointer rounded-full border-border/70 bg-background/70 px-2.5 backdrop-blur-sm"
              title={t(activeOption.labelKey)}
            >
              <ActiveIcon className="size-3.5" />
            </Button>
          )
        }
      />
      <DropdownMenuContent
        align="end"
        className="min-w-40 rounded-2xl border-border/70 bg-background/92 backdrop-blur-xl"
      >
        {options.map((option) => {
          const label = t(option.labelKey);

          return (
            <DropdownMenuItem
              key={option.value}
              className="cursor-pointer rounded-xl"
              onClick={() => {
                setTheme(option.value);
                void fetch("/api/settings", {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ theme: option.value }),
                });
              }}
            >
              <span className="flex w-full items-center justify-between gap-3">
                <span className="inline-flex items-center gap-2">
                  <option.icon className="size-3.5" />
                  {label}
                </span>
                {activeTheme === option.value ? (
                  <span className="text-xs text-muted-foreground">
                    {t("selector.current")}
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
