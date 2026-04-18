/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * SPDX-License-Identifier: Elastic-2.0
 */

"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  BookMarked,
  BrainCircuit,
  CalendarDays,
  CheckSquare,
  ChevronRight,
  CreditCard,
  LayoutDashboard,
  LayoutGrid,
  Scale,
  Settings,
  Tag,
  Target,
  Users,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";

const NAV_GROUPS_KEY = "princeps:nav-groups-collapsed";

function readLocalJson(key: string): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(key) ?? "{}") as Record<
      string,
      boolean
    >;
  } catch {
    return {};
  }
}

export function SidebarNav() {
  const t = useTranslations("chat");
  const ts = useTranslations("shell");
  const pathname = usePathname();

  const [initialNavCollapsed] = useState<Record<string, boolean>>(() => {
    if (typeof window === "undefined")
      return { apps: true, intel: true, account: true };
    return {
      apps: true,
      intel: true,
      account: true,
      ...readLocalJson(NAV_GROUPS_KEY),
    };
  });

  const persistNavGroup = useCallback((group: string, open: boolean) => {
    const current = readLocalJson(NAV_GROUPS_KEY);
    localStorage.setItem(
      NAV_GROUPS_KEY,
      JSON.stringify({ ...current, [group]: !open }),
    );
  }, []);

  const navGroups = [
    {
      key: "apps",
      icon: LayoutGrid,
      label: ts("nav.apps"),
      items: [
        { href: "/tasks", icon: CheckSquare, label: t("sidebar.navTasks") },
        { href: "/goals", icon: Target, label: t("sidebar.navGoals") },
        { href: "/contacts", icon: Users, label: t("sidebar.navContacts") },
        {
          href: "/meetings",
          icon: CalendarDays,
          label: t("sidebar.navMeetings"),
        },
      ],
    },
    {
      key: "intel",
      icon: BrainCircuit,
      label: ts("nav.intel"),
      items: [
        {
          href: "/knowledge",
          icon: BrainCircuit,
          label: t("sidebar.navKnowledge"),
        },
        { href: "/decisions", icon: Scale, label: t("sidebar.navDecisions") },
        { href: "/memory", icon: BookMarked, label: t("sidebar.navMemory") },
        { href: "/labels", icon: Tag, label: t("sidebar.navLabels") },
      ],
    },
    {
      key: "account",
      icon: Settings,
      label: t("sidebar.navGroupAccount"),
      items: [
        { href: "/settings", icon: Settings, label: t("sidebar.navSettings") },
        {
          href: "/pricing",
          icon: CreditCard,
          label: t("sidebar.navPricing"),
        },
      ],
    },
  ] as const;

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{t("sidebar.navGroup")}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {/* Home — always flat */}
          <SidebarMenuItem>
            <SidebarMenuButton
              render={<Link href="/home" />}
              isActive={pathname === "/home"}
              tooltip={t("sidebar.navHome")}
              className="cursor-pointer"
            >
              <LayoutDashboard className="size-4 shrink-0" />
              <span className="truncate">{t("sidebar.navHome")}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {/* Collapsible nav groups */}
          {navGroups.map((group) => {
            const isGroupActive = group.items.some(({ href }) =>
              pathname.startsWith(href),
            );
            return (
              <Collapsible
                key={group.key}
                defaultOpen={!initialNavCollapsed[group.key]}
                onOpenChange={(open) => persistNavGroup(group.key, open)}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger
                    render={
                      <SidebarMenuButton
                        isActive={isGroupActive}
                        tooltip={group.label}
                        className="cursor-pointer"
                      />
                    }
                  >
                    <group.icon className="size-4 shrink-0" />
                    <span className="truncate">{group.label}</span>
                    <ChevronRight className="ml-auto size-3.5 shrink-0 transition-transform duration-200 group-data-open/collapsible:rotate-90" />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {group.items.map(({ href, icon: Icon, label }) => (
                        <SidebarMenuSubItem key={href}>
                          <SidebarMenuSubButton
                            render={<Link href={href} />}
                            isActive={pathname.startsWith(href)}
                          >
                            <Icon className="size-4 shrink-0" />
                            <span>{label}</span>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
