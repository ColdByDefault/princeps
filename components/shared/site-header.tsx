/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Globe } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ThemeToggle from "@/components/theme/ThemeToggle";
import { useLanguage } from "@/hooks/use-language";
import { getMessage } from "@/lib/i18n";
import { type AppLanguage, type MessageDictionary } from "@/types/i18n";

type SiteHeaderProps = {
  messages: MessageDictionary;
};

function LanguageToggle({ messages }: { messages: MessageDictionary }) {
  const router = useRouter();
  const { language, changeLanguage } = useLanguage();

  const handleLanguageChange = (nextLanguage: AppLanguage) => {
    if (nextLanguage === language) return;
    changeLanguage(nextLanguage);
    router.refresh();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-label={getMessage(
              messages,
              "shell.language.groupLabel",
              "Language selector",
            )}
            className="cursor-pointer rounded-full border-border/70 bg-background/70 px-3 backdrop-blur-sm"
          >
            <Globe className="size-3.5" />
            {language.toUpperCase()}
          </Button>
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
                  {getMessage(messages, "shell.language.current", "Current")}
                </span>
              ) : null}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function SiteHeader({ messages }: SiteHeaderProps) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="h-4" />
      <Link href="/home" className="text-sm font-medium">
        {getMessage(messages, "shell.nav.home", "Workspace")}
      </Link>
      <div className="ml-auto flex items-center gap-2">
        <LanguageToggle messages={messages} />
        <ThemeToggle messages={messages} />
      </div>
    </header>
  );
}
