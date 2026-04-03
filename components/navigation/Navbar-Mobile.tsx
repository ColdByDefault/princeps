/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

"use client";

import Link from "next/link";
import { type Dispatch, type SetStateAction } from "react";
import { LogOut, Menu, Search, X, type LucideIcon } from "lucide-react";
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

export type NavbarMobileBarProps = {
  isMenuOpen: boolean;
  setIsMenuOpen: Dispatch<SetStateAction<boolean>>;
};

export type NavbarMobilePanelProps = {
  navLinks: NavLink[];
  pathname: string;
  tier?: string | null | undefined;
  userLabel: string;
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

export function NavbarMobileBar({
  isMenuOpen,
  setIsMenuOpen,
}: NavbarMobileBarProps) {
  const t = useTranslations("shell");

  return (
    <div className="ml-auto flex items-center gap-2 min-[1000px]:hidden">
      <Button
        type="button"
        variant="outline"
        size="sm"
        aria-label={t("search.trigger")}
        className="cursor-pointer rounded-full border-border/70 bg-background/70 px-2.5 backdrop-blur-sm"
        onClick={() => window.dispatchEvent(new Event("global-search:open"))}
      >
        <Search className="size-3.5" />
        <kbd className="pointer-events-none select-none rounded border border-border/70 bg-muted px-1.5 py-0.5 text-xs font-mono text-muted-foreground">
          ⌘K
        </kbd>
      </Button>
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        aria-label={isMenuOpen ? t("nav.closeMenu") : t("nav.openMenu")}
        title={isMenuOpen ? t("nav.closeMenu") : t("nav.openMenu")}
        className="cursor-pointer rounded-full border-border/70 bg-background/70 backdrop-blur-sm"
        onClick={() => setIsMenuOpen((current) => !current)}
      >
        {isMenuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
      </Button>
    </div>
  );
}

export function NavbarMobilePanel({
  navLinks,
  pathname,
  tier,
  userLabel,
  isSigningOut,
  onSignOut,
}: NavbarMobilePanelProps) {
  const t = useTranslations("shell");

  return (
    <div className="mt-4 space-y-4 border-t border-border/60 pt-4 min-[1000px]:hidden">
      <nav className="grid gap-2">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = isActivePath(pathname, link.href);
          return (
            <Button
              key={link.href}
              variant={isActive ? "secondary" : "ghost"}
              size="default"
              className="cursor-pointer justify-start rounded-2xl bg-transparent px-4"
              nativeButton={false}
              render={<Link href={link.href} />}
            >
              <Icon className="size-4" />
              {link.label}
            </Button>
          );
        })}
      </nav>

      <div className="flex flex-wrap items-center gap-2">
        <LanguageToggle />
        <ThemeToggle />
      </div>

      <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-background/70 px-4 py-3 backdrop-blur-sm">
        <span className="truncate text-sm text-muted-foreground">
          {userLabel}
        </span>
        {tier && (
          <div className="ml-3 flex shrink-0 items-center gap-1.5">
            <PlanBadge tier={tier} />
          </div>
        )}
      </div>

      <Button
        type="button"
        variant="outline"
        className="cursor-pointer rounded-2xl border-border/70 bg-background/70 backdrop-blur-sm"
        disabled={isSigningOut}
        onClick={onSignOut}
      >
        <LogOut className="size-4" />
        {isSigningOut ? t("nav.signingOut") : t("nav.signOut")}
      </Button>
    </div>
  );
}
