/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version canary-v1.1.8
 * @since beta
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
  LayoutDashboard,
  LayoutGrid,
  Scale,
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
  const tCommon = useTranslations("common");
  const ts = useTranslations("shell");
  const pathname = usePathname();

  const [initialNavCollapsed] = useState<Record<string, boolean>>(() => {
    if (typeof window === "undefined") return { apps: true, intel: true };
    return {
      apps: true,
      intel: true,
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
        {
          href: "/tasks",
          icon: CheckSquare,
          label: tCommon("entities.tasks"),
        },
        { href: "/goals", icon: Target, label: tCommon("entities.goals") },
        {
          href: "/contacts",
          icon: Users,
          label: tCommon("entities.contacts"),
        },
        {
          href: "/meetings",
          icon: CalendarDays,
          label: tCommon("entities.meetings"),
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
          label: tCommon("entities.knowledge"),
        },
        {
          href: "/decisions",
          icon: Scale,
          label: tCommon("entities.decisions"),
        },
        {
          href: "/memory",
          icon: BookMarked,
          label: tCommon("entities.memory"),
        },
        { href: "/labels", icon: Tag, label: tCommon("entities.labels") },
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

