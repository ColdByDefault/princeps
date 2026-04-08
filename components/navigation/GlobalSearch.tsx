/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
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
  User2,
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

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const t = useTranslations("shell");

  // cmd+k / ctrl+k keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // custom event from navbar trigger buttons
  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("global-search:open", handler);
    return () => window.removeEventListener("global-search:open", handler);
  }, []);

  const navigate = useCallback(
    (href: string) => {
      setOpen(false);
      router.push(href);
    },
    [router],
  );

  const navLinks: { href: string; icon: LucideIcon; label: string }[] = [
    { href: "/home", icon: LayoutDashboard, label: t("nav.home") },
    { href: "/chat", icon: MessageSquare, label: t("nav.chat") },
    { href: "/knowledge", icon: BrainCircuit, label: t("nav.knowledge") },
    { href: "/labels", icon: Tag, label: t("nav.labels") },
    { href: "/tasks", icon: CheckSquare, label: t("nav.tasks") },
    { href: "/goals", icon: Target, label: t("nav.goals") },
    { href: "/contacts", icon: Users, label: t("nav.contacts") },
    { href: "/meetings", icon: CalendarDays, label: t("nav.meetings") },
    { href: "/decisions", icon: Scale, label: t("nav.decisions") },
    { href: "/memory", icon: BookMarked, label: t("nav.memory") },
    { href: "/settings", icon: Settings, label: t("nav.settings") },
    { href: "/pricing", icon: CreditCard, label: t("nav.pricing") },
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
      </CommandList>
    </CommandDialog>
  );
}
