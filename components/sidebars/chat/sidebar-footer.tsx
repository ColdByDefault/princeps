/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * SPDX-License-Identifier: Elastic-2.0
 */

"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { ChevronUp, LogOut, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { LanguageToggle, PlanBadge } from "@/components/shared";
import { ThemeToggle } from "@/components/theme";

type SidebarFooterSectionProps = {
  sessionUser: {
    name: string | null;
    email: string | null;
  } | null;
  tier?: string | null;
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

  const userLabel =
    sessionUser?.name?.trim() ||
    sessionUser?.email ||
    t("sidebar.userFallback");

  return (
    <SidebarFooter>
      {isCollapsed ? (
        <SidebarMenu>
          <SidebarMenuItem>
            <ThemeToggle collapsed />
          </SidebarMenuItem>
          <SidebarMenuItem>
            <LanguageToggle collapsed />
          </SidebarMenuItem>
        </SidebarMenu>
      ) : (
        <div className="flex items-center gap-1 px-2 pb-1">
          <ThemeToggle />
          <LanguageToggle />
        </div>
      )}
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<SidebarMenuButton className="cursor-pointer" />}
            >
              {isCollapsed ? (
                <User className="size-4 shrink-0" />
              ) : (
                <>
                  {" "}
                  <div className="flex flex-1 flex-col leading-none text-left overflow-hidden">
                    <span className="flex items-center gap-1.5 font-medium text-sm truncate">
                      <span className="truncate">{userLabel}</span>
                      {tier && <PlanBadge tier={tier} />}
                    </span>
                    {sessionUser?.email && (
                      <span className="text-xs text-sidebar-foreground/60 truncate">
                        {sessionUser.email}
                      </span>
                    )}
                  </div>
                  <ChevronUp className="ml-auto size-4 shrink-0" />
                </>
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="end" className="w-56">
              <DropdownMenuItem
                className="cursor-pointer"
                render={<Link href="/profile" />}
              >
                <User className="mr-2 size-4" />
                {t("sidebar.profile")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer text-destructive focus:text-destructive"
                disabled={isSigningOut}
                onClick={() => void handleSignOut()}
              >
                <LogOut className="mr-2 size-4" />
                {isSigningOut
                  ? t("sidebar.signingOut")
                  : t("sidebar.signOut")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>
  );
}
