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

import Link from "next/link";
import { type Dispatch, type SetStateAction } from "react";
import { LogOut, Menu, X, Search, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/theme/ThemeToggle";
import { LanguageToggle, PlanBadge } from "@/components/shared";
import { NotificationBell } from "@/components/notifications";
import { CalendarTrigger } from "@/components/calendar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

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
  userInitials: string;
  isSigningOut: boolean;
  onSignOut: () => void;
};

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
        title={t("search.trigger")}
        className="cursor-pointer rounded-full border-border/70 bg-background/70 px-2.5 backdrop-blur-sm"
        onClick={() => window.dispatchEvent(new Event("global-search:open"))}
      >
        <Search className="size-3.5" />
        <kbd className="pointer-events-none select-none rounded border border-border/70 bg-muted px-1.5 py-0.5 text-xs font-mono text-muted-foreground">
          ⌘K
        </kbd>
      </Button>
      <NotificationBell />
      <CalendarTrigger />
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
  userInitials,
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

      <Button
        type="button"
        variant="outline"
        className="cursor-pointer w-full justify-start gap-3 rounded-2xl border-border/70 bg-background/70 px-4 py-3 h-auto backdrop-blur-sm"
        nativeButton={false}
        render={<Link href="/profile" />}
      >
        <Avatar className="size-7 shrink-0">
          <AvatarFallback className="bg-primary/10 text-primary text-[11px] font-semibold">
            {userInitials}
          </AvatarFallback>
        </Avatar>
        <span className="truncate text-sm text-muted-foreground">
          {userLabel}
        </span>
        {tier && (
          <div className="ml-auto flex shrink-0 items-center gap-1.5">
            <PlanBadge tier={tier} />
          </div>
        )}
      </Button>

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
