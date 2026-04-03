/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

"use client";

import Link from "next/link";
import { LogOut, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/theme/ThemeToggle";
import { LanguageToggle } from "@/components/shared";
import { cn } from "@/lib/utils";

type NavLink = {
  href: string;
  icon: LucideIcon;
  label: string;
};

type NavbarDesktopProps = {
  navLinks: NavLink[];
  pathname: string;
  tier?: string | null | undefined;
  isSigningOut: boolean;
  onSignOut: () => void;
};

function PlanBadge({ tier }: { tier: string }) {
  const t = useTranslations("shell.nav");
  const isFree = tier === "free";
  const label =
    tier === "pro"
      ? t("planPro")
      : tier === "premium"
        ? t("planPremium")
        : t("planFree");

  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[10px] font-medium tracking-wide",
        isFree
          ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
          : tier === "premium"
            ? "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300"
            : "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
      )}
    >
      {label}
    </span>
  );
}

function isActivePath(pathname: string, href: string) {
  if (href === "/home") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function NavbarDesktop({
  navLinks,
  pathname,
  tier,
  isSigningOut,
  onSignOut,
}: NavbarDesktopProps) {
  const t = useTranslations("shell");

  return (
    <>
      <nav className="hidden min-[1000px]:flex min-[1000px]:items-center min-[1000px]:gap-2">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = isActivePath(pathname, link.href);
          return (
            <Button
              key={link.href}
              variant={isActive ? "secondary" : "ghost"}
              size="sm"
              className={cn(
                "cursor-pointer rounded-full bg-transparent px-3",
                isActive && "shadow-sm",
              )}
              nativeButton={false}
              render={<Link href={link.href} />}
            >
              <Icon className="size-3.5" />
              {link.label}
            </Button>
          );
        })}
      </nav>

      <div className="ml-auto hidden items-center gap-2 min-[1000px]:flex">
{/*         <Button
          type="button"
          variant="outline"
          size="sm"
          aria-label={t("search.trigger")}
          title={t("search.trigger")}
          className="cursor-pointer justify-start rounded-full border-border/70 bg-background/70 px-3 min-w-32 min-[1150px]:min-w-52 min-[1280px]:min-w-64 backdrop-blur-sm"
          onClick={() => window.dispatchEvent(new Event("global-search:open"))}
        >
          <Search className="size-3.5" />
          <span className="text-muted-foreground">
            {t("search.triggerLabel")}
          </span>
          <kbd className="pointer-events-none ml-auto hidden select-none rounded border border-border/70 bg-muted px-2 py-0.5 text-xs font-mono text-muted-foreground sm:inline-flex">
            ⌘K
          </kbd>
        </Button> */}
        <LanguageToggle />
        <ThemeToggle />
        {tier && (
          <div className="flex items-center rounded-full px-2.5 py-1.5 backdrop-blur-sm">
            <PlanBadge tier={tier} />
          </div>
        )}
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          aria-label={isSigningOut ? t("nav.signingOut") : t("nav.signOut")}
          title={isSigningOut ? t("nav.signingOut") : t("nav.signOut")}
          className="cursor-pointer rounded-full border-border/70 bg-background/70 backdrop-blur-sm"
          disabled={isSigningOut}
          onClick={onSignOut}
        >
          <LogOut className="size-3.5" />
        </Button>
      </div>
    </>
  );
}
