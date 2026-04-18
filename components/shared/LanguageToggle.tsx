/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version beta
 * @since beta
 * @module
 * @description
 */

"use client";

import { Globe } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
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
import { useLanguage } from "@/hooks/use-language";
import { type AppLanguage } from "@/types/i18n";

export function LanguageToggle({ collapsed = false }: { collapsed?: boolean }) {
  const t = useTranslations("shell.language");
  const router = useRouter();
  const { language, changeLanguage } = useLanguage();

  const handleLanguageChange = (nextLanguage: AppLanguage) => {
    if (nextLanguage === language) return;
    changeLanguage(nextLanguage);
    void fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language: nextLanguage }),
    });
    router.refresh();
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              collapsed ? (
                <SidebarMenuButton
                  className="cursor-pointer"
                  tooltip={t("groupLabel")}
                >
                  <Globe className="size-3.5" />
                </SidebarMenuButton>
              ) : (
                <TooltipTrigger
                  render={
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      aria-label={t("groupLabel")}
                      className="cursor-pointer rounded-full border-border/70 bg-background/70 px-2.5 backdrop-blur-sm"
                    />
                  }
                >
                  <Globe className="size-3.5" />
                </TooltipTrigger>
              )
            }
          />
          <DropdownMenuContent
            align="end"
            className="min-w-40 rounded-2xl border-border/70 bg-background/92 backdrop-blur-xl"
          >
            {(["de", "en"] as const).map((option) => (
              <DropdownMenuItem
                key={option}
                className="cursor-pointer rounded-xl"
                onClick={() => handleLanguageChange(option)}
              >
                <span className="flex w-full items-center justify-between gap-3">
                  <span>{option.toUpperCase()}</span>
                  {language === option ? (
                    <span className="text-xs text-muted-foreground">
                      {t("current")}
                    </span>
                  ) : null}
                </span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        {!collapsed && <TooltipContent>{t("groupLabel")}</TooltipContent>}
      </Tooltip>
    </TooltipProvider>
  );
}

export default LanguageToggle;
