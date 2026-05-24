/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version canary-v1.1.8
 * @since beta
 */

"use client";

import { useTranslations } from "next-intl";
import {
  LayoutDashboard,
  MessageSquare,
  Settings,
  CheckSquare,
  CreditCard,
  BrainCircuit,
  Users,
  CalendarDays,
  Scale,
  Tag,
  Target,
  BookMarked,
  BookOpen,
  BarChart3,
  User2,
  Loader2,
  type LucideIcon,
} from "lucide-react";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { buildKeywords, useGlobalSearch } from "./logic/useGlobalSearch";

export function GlobalSearch() {
  const { open, setOpen, data, navigate } = useGlobalSearch();
  const t = useTranslations("shell");
  const tCommon = useTranslations("common");

  const navLinks: { href: string; icon: LucideIcon; label: string }[] = [
    { href: "/home", icon: LayoutDashboard, label: t("nav.home") },
    { href: "/chat", icon: MessageSquare, label: t("nav.chat") },
    {
      href: "/knowledge",
      icon: BrainCircuit,
      label: tCommon("entities.knowledge"),
    },
    { href: "/labels", icon: Tag, label: tCommon("entities.labels") },
    { href: "/tasks", icon: CheckSquare, label: tCommon("entities.tasks") },
    { href: "/goals", icon: Target, label: tCommon("entities.goals") },
    { href: "/contacts", icon: Users, label: tCommon("entities.contacts") },
    {
      href: "/meetings",
      icon: CalendarDays,
      label: tCommon("entities.meetings"),
    },
    {
      href: "/decisions",
      icon: Scale,
      label: tCommon("entities.decisions"),
    },
    { href: "/memory", icon: BookMarked, label: tCommon("entities.memory") },
    {
      href: "/reading-queue",
      icon: BookOpen,
      label: tCommon("entities.readingQueue"),
    },
    {
      href: "/reports",
      icon: BarChart3,
      label: tCommon("entities.reports"),
    },
    {
      href: "/settings",
      icon: Settings,
      label: tCommon("entities.settings"),
    },
    { href: "/pricing", icon: CreditCard, label: tCommon("entities.plans") },
    { href: "/profile", icon: User2, label: t("nav.profile") },
  ];

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title={t("search.title")}
      description={t("search.description")}
    >
      <CommandInput placeholder={t("search.placeholder")} />
      <CommandList>
        {open && data === null ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <CommandEmpty>{t("search.empty")}</CommandEmpty>

            <CommandGroup heading={t("search.navigation")}>
              {navLinks.map(({ href, icon: Icon, label }) => (
                <CommandItem
                  key={href}
                  value={label}
                  onSelect={() => navigate(href)}
                >
                  <Icon />
                  {label}
                </CommandItem>
              ))}
            </CommandGroup>

            {(data?.labels.length ?? 0) > 0 && (
              <CommandGroup heading={tCommon("entities.labels")}>
                {data!.labels.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={item.name}
                    keywords={buildKeywords(
                      "label",
                      tCommon("entities.labels"),
                    )}
                    onSelect={() => navigate("/labels")}
                  >
                    <Tag />
                    {item.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {(data?.tasks.length ?? 0) > 0 && (
              <CommandGroup heading={tCommon("entities.tasks")}>
                {data!.tasks.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={item.title}
                    keywords={buildKeywords(
                      "task",
                      tCommon("entities.tasks"),
                      ...item.labels.map((label) => label.name),
                    )}
                    onSelect={() => navigate("/tasks")}
                  >
                    <CheckSquare />
                    {item.title}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {(data?.contacts.length ?? 0) > 0 && (
              <CommandGroup heading={tCommon("entities.contacts")}>
                {data!.contacts.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={item.name}
                    keywords={buildKeywords(
                      "contact",
                      tCommon("entities.contacts"),
                      item.company,
                      ...item.labels.map((label) => label.name),
                    )}
                    onSelect={() => navigate("/contacts")}
                  >
                    <Users />
                    <span className="flex-1 truncate">{item.name}</span>
                    {item.company && (
                      <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                        {item.company}
                      </span>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {(data?.meetings.length ?? 0) > 0 && (
              <CommandGroup heading={tCommon("entities.meetings")}>
                {data!.meetings.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={item.title}
                    keywords={buildKeywords(
                      "meeting",
                      tCommon("entities.meetings"),
                      ...item.labels.map((label) => label.name),
                    )}
                    onSelect={() => navigate("/meetings")}
                  >
                    <CalendarDays />
                    {item.title}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {(data?.decisions.length ?? 0) > 0 && (
              <CommandGroup heading={tCommon("entities.decisions")}>
                {data!.decisions.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={item.title}
                    keywords={buildKeywords(
                      "decision",
                      tCommon("entities.decisions"),
                      ...item.labels.map((label) => label.name),
                    )}
                    onSelect={() => navigate("/decisions")}
                  >
                    <Scale />
                    {item.title}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {(data?.goals.length ?? 0) > 0 && (
              <CommandGroup heading={tCommon("entities.goals")}>
                {data!.goals.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={item.title}
                    keywords={buildKeywords(
                      "goal",
                      tCommon("entities.goals"),
                      ...item.labels.map((label) => label.name),
                    )}
                    onSelect={() => navigate("/goals")}
                  >
                    <Target />
                    {item.title}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
