/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * SPDX-License-Identifier: Elastic-2.0
 */

"use client";

import { useCallback, useSyncExternalStore } from "react";
import { flushSync } from "react-dom";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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

  const toggleTheme = useCallback(
    (newTheme: "light" | "dark" | "system") => {
      const resolved =
        newTheme === "system"
          ? window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light"
          : newTheme;

      void fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: newTheme }),
      });

      if (!document.startViewTransition) {
        setTheme(newTheme);
        return;
      }

      void document
        .startViewTransition(() => {
          flushSync(() => {
            document.documentElement.classList.toggle(
              "dark",
              resolved === "dark",
            );
          });
        })
        .ready.then(() => {
          document.documentElement
            .animate(
              { clipPath: ["inset(0 100% 0 0)", "inset(0 0 0 0)"] },
              {
                duration: 700,
                easing: "ease-in-out",
                pseudoElement: "::view-transition-new(root)",
              },
            )
            .finished.finally(() => {
              setTheme(newTheme);
            });
        });
    },
    [setTheme],
  );

  return (
    <>
      <style>{`::view-transition-old(root),::view-transition-new(root){animation:none;mix-blend-mode:normal;}`}</style>
      <TooltipProvider>
        <Tooltip>
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
                  <TooltipTrigger
                    render={
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        aria-label={groupLabel}
                        className="cursor-pointer rounded-full border-border/70 bg-background/70 px-2.5 backdrop-blur-sm"
                      />
                    }
                  >
                    <ActiveIcon className="size-3.5" />
                  </TooltipTrigger>
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
                    onClick={() => toggleTheme(option.value)}
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
          {!collapsed && (
            <TooltipContent>{t(activeOption.labelKey)}</TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
    </>
  );
}
