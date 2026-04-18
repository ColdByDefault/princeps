/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * SPDX-License-Identifier: Elastic-2.0
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { CreditCard, LogOut, Settings, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { LanguageToggle, PlanBadge } from "@/components/shared";
import { ThemeToggle } from "@/components/theme";

type SidebarFooterSectionProps = {
  sessionUser: {
    name: string | null;
    email: string | null;
  } | null;
  tier?: string | null | undefined;
  isCollapsed: boolean;
  isSigningOut: boolean;
  handleSignOut: () => Promise<void>;
};

export function SidebarFooterSection({
  sessionUser,
  tier,
  isCollapsed,
  isSigningOut,
  handleSignOut,
}: SidebarFooterSectionProps) {
  const t = useTranslations("chat");
  const pathname = usePathname();

  const userLabel =
    sessionUser?.name?.trim() ||
    sessionUser?.email ||
    t("sidebar.userFallback");

  if (isCollapsed) {
    return (
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              render={<Link href="/profile" />}
              isActive={pathname === "/profile"}
              tooltip={userLabel}
              className="cursor-pointer"
            >
              <User className="size-4 shrink-0" />
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <ThemeToggle collapsed />
          </SidebarMenuItem>
          <SidebarMenuItem>
            <LanguageToggle collapsed />
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              render={<Link href="/settings" />}
              isActive={pathname.startsWith("/settings")}
              tooltip={t("sidebar.navSettings")}
              className="cursor-pointer"
            >
              <Settings className="size-4 shrink-0" />
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              render={<Link href="/pricing" />}
              isActive={pathname.startsWith("/pricing")}
              tooltip={t("sidebar.navPricing")}
              className="cursor-pointer"
            >
              <CreditCard className="size-4 shrink-0" />
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip={
                isSigningOut ? t("sidebar.signingOut") : t("sidebar.signOut")
              }
              disabled={isSigningOut}
              className="cursor-pointer text-destructive hover:text-destructive"
              onClick={() => void handleSignOut()}
            >
              <LogOut className="size-4 shrink-0" />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    );
  }

  return (
    <SidebarFooter>
      {/* User info → link to profile */}
      <Link
        href="/profile"
        className="flex flex-col gap-0.5 rounded-md px-2 py-2 hover:bg-sidebar-accent transition-colors overflow-hidden"
      >
        <span className="flex items-center gap-1.5 font-medium text-sm">
          <span className="truncate">{userLabel}</span>
          {tier && <PlanBadge tier={tier} />}
        </span>
        {sessionUser?.email && (
          <span className="text-xs text-sidebar-foreground/60 truncate">
            {sessionUser.email}
          </span>
        )}
      </Link>

      {/* Actions row */}
      <div className="flex items-center gap-1 px-1 pb-1">
        <ThemeToggle />
        <LanguageToggle />
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  aria-label={t("sidebar.navSettings")}
                  className="cursor-pointer rounded-full border-border/70 bg-background/70 px-2.5 backdrop-blur-sm"
                  render={<Link href="/settings" />}
                />
              }
            >
              <Settings className="size-3.5" />
            </TooltipTrigger>
            <TooltipContent>{t("sidebar.navSettings")}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  aria-label={t("sidebar.navPricing")}
                  className="cursor-pointer rounded-full border-border/70 bg-background/70 px-2.5 backdrop-blur-sm"
                  render={<Link href="/pricing" />}
                />
              }
            >
              <CreditCard className="size-3.5" />
            </TooltipTrigger>
            <TooltipContent>{t("sidebar.navPricing")}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  aria-label={
                    isSigningOut
                      ? t("sidebar.signingOut")
                      : t("sidebar.signOut")
                  }
                  disabled={isSigningOut}
                  className="cursor-pointer rounded-full border-border/70 bg-background/70 px-2.5 backdrop-blur-sm text-destructive hover:text-destructive"
                  onClick={() => void handleSignOut()}
                />
              }
            >
              <LogOut className="size-3.5" />
            </TooltipTrigger>
            <TooltipContent>
              {isSigningOut ? t("sidebar.signingOut") : t("sidebar.signOut")}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </SidebarFooter>
  );
}
