/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

"use client";

import Link from "next/link";
import {
  LogOut,
  LayoutGrid,
  ChevronDown,
  BrainCog,
  type LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/theme/ThemeToggle";
import { LanguageToggle } from "@/components/shared";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { TIER_RING_COLORS } from "@/lib/tiers/colors";
import { NotificationBell } from "@/components/notifications";

type NavLink = {
  href: string;
  icon: LucideIcon;
  label: string;
};

type NavbarDesktopProps = {
  navLinks: NavLink[];
  pathname: string;
  tier?: string | null | undefined;
  userInitials: string;
  isSigningOut: boolean;
  onSignOut: () => void;
};

function getTierRingClass(tier?: string | null) {
  if (!tier) return "border border-border/70";
  const ringColor =
    TIER_RING_COLORS[tier as keyof typeof TIER_RING_COLORS] ??
    TIER_RING_COLORS.pro;
  return cn(
    "ring-2 ring-offset-1 ring-offset-background border-transparent",
    ringColor,
  );
}

function isActivePath(pathname: string, href: string) {
  if (href === "/home") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

const GROUPED_HREFS = new Set(["/tasks", "/goals", "/contacts", "/meetings"]);
const INTEL_HREFS = new Set(["/knowledge", "/decisions", "/labels"]);
const AFTER_DROPDOWN_HREFS = new Set(["/settings", "/pricing"]);

export default function NavbarDesktop({
  navLinks,
  pathname,
  tier,
  userInitials,
  isSigningOut,
  onSignOut,
}: NavbarDesktopProps) {
  const t = useTranslations("shell");

  const intelLinks = navLinks.filter((l) => INTEL_HREFS.has(l.href));
  const isIntelActive = intelLinks.some((l) => isActivePath(pathname, l.href));

  const flatLinks = navLinks.filter(
    (l) => !GROUPED_HREFS.has(l.href) && !INTEL_HREFS.has(l.href),
  );
  const beforeLinks = flatLinks.filter(
    (l) => !AFTER_DROPDOWN_HREFS.has(l.href),
  );
  const afterLinks = flatLinks.filter((l) => AFTER_DROPDOWN_HREFS.has(l.href));
  const groupedLinks = navLinks.filter((l) => GROUPED_HREFS.has(l.href));
  const isGroupActive = groupedLinks.some((l) =>
    isActivePath(pathname, l.href),
  );

  return (
    <>
      <nav className="hidden min-[1000px]:flex min-[1000px]:items-center min-[1000px]:gap-2">
        {beforeLinks.map((link) => {
          const Icon = link.icon;
          const isActive = isActivePath(pathname, link.href);
          return (
            <Button
              key={link.href}
              variant={isActive ? "secondary" : "ghost"}
              size="sm"
              className={cn(
                "cursor-pointer rounded-none bg-transparent px-3",
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

        {/* Intelligence dropdown: Knowledge Base + Decisions */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                type="button"
                variant={isIntelActive ? "secondary" : "ghost"}
                size="sm"
                className={cn(
                  "cursor-pointer rounded-none bg-transparent px-3",
                  isIntelActive && "shadow-sm",
                )}
              />
            }
          >
            <BrainCog className="size-3.5" />
            {t("nav.intel")}
            <ChevronDown className="size-3" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="bottom"
            align="start"
            className="min-w-44 rounded-md border-border/70 bg-background/95 backdrop-blur-xl"
          >
            <DropdownMenuGroup>
              {intelLinks.map((link) => {
                const Icon = link.icon;
                const isActive = isActivePath(pathname, link.href);
                return (
                  <DropdownMenuItem
                    key={link.href}
                    className={cn(
                      "cursor-pointer rounded-sm",
                      isActive && "bg-accent text-accent-foreground",
                    )}
                    render={<Link href={link.href} />}
                  >
                    <Icon className="size-3.5" />
                    {link.label}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Apps dropdown: Tasks, Contacts, Meetings */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                type="button"
                variant={isGroupActive ? "secondary" : "ghost"}
                size="sm"
                className={cn(
                  "cursor-pointer rounded-none bg-transparent px-3",
                  isGroupActive && "shadow-sm",
                )}
              />
            }
          >
            <LayoutGrid className="size-3.5" />
            {t("nav.apps")}
            <ChevronDown className="size-3" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="bottom"
            align="start"
            className="min-w-44 rounded-md border-border/70 bg-background/95 backdrop-blur-xl"
          >
            <DropdownMenuGroup>
              {groupedLinks.map((link) => {
                const Icon = link.icon;
                const isActive = isActivePath(pathname, link.href);
                return (
                  <DropdownMenuItem
                    key={link.href}
                    className={cn(
                      "cursor-pointer rounded-sm",
                      isActive && "bg-accent text-accent-foreground",
                    )}
                    render={<Link href={link.href} />}
                  >
                    <Icon className="size-3.5" />
                    {link.label}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        {afterLinks.map((link) => {
          const Icon = link.icon;
          const isActive = isActivePath(pathname, link.href);
          return (
            <Button
              key={link.href}
              variant={isActive ? "secondary" : "ghost"}
              size="sm"
              className={cn(
                "cursor-pointer rounded-none bg-transparent px-3",
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

        <NotificationBell />
        <LanguageToggle />
        <ThemeToggle />
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  aria-label={t("nav.profile")}
                  className={cn(
                    "cursor-pointer rounded-full bg-transparent p-0",
                    getTierRingClass(tier),
                  )}
                  nativeButton={false}
                  render={<Link href="/profile" />}
                />
              }
            >
              <Avatar className="size-7 rounded-full">
                <AvatarFallback className="bg-primary/10 text-primary text-[11px] font-semibold rounded-full">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent>{t("nav.profile")}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  aria-label={
                    isSigningOut ? t("nav.signingOut") : t("nav.signOut")
                  }
                  className="cursor-pointer rounded-sm border-border/70 bg-transparent"
                  disabled={isSigningOut}
                  onClick={onSignOut}
                />
              }
            >
              <LogOut className="size-3.5" />
            </TooltipTrigger>
            <TooltipContent>
              {isSigningOut ? t("nav.signingOut") : t("nav.signOut")}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </>
  );
}
