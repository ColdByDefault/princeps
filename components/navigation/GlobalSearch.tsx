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

type TaskItem = { id: string; title: string };
type ContactItem = { id: string; name: string; company: string | null };
type MeetingItem = { id: string; title: string };
type DecisionItem = { id: string; title: string };
type GoalItem = { id: string; title: string };

type SearchData = {
  tasks: TaskItem[];
  contacts: ContactItem[];
  meetings: MeetingItem[];
  decisions: DecisionItem[];
  goals: GoalItem[];
};

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<SearchData | null>(null);
  const [loading, setLoading] = useState(false);
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

  // fetch all content once on first open
  useEffect(() => {
    if (!open || data !== null || loading) return;
    setLoading(true);
    Promise.all([
      fetch("/api/tasks").then((r) => r.json()),
      fetch("/api/contacts").then((r) => r.json()),
      fetch("/api/meetings").then((r) => r.json()),
      fetch("/api/decisions").then((r) => r.json()),
      fetch("/api/goals").then((r) => r.json()),
    ])
      .then(([taskRes, contactRes, meetingRes, decisionRes, goalRes]) => {
        setData({
          tasks: taskRes.tasks ?? [],
          contacts: contactRes.contacts ?? [],
          meetings: meetingRes.meetings ?? [],
          decisions: decisionRes.decisions ?? [],
          goals: goalRes.goals ?? [],
        });
      })
      .catch(() => {
        setData({
          tasks: [],
          contacts: [],
          meetings: [],
          decisions: [],
          goals: [],
        });
      })
      .finally(() => setLoading(false));
  }, [open, data, loading]);

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
        {loading ? (
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

            {(data?.tasks.length ?? 0) > 0 && (
              <CommandGroup heading={t("search.tasks")}>
                {data!.tasks.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={item.title}
                    keywords={["task"]}
                    onSelect={() => navigate("/tasks")}
                  >
                    <CheckSquare />
                    {item.title}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {(data?.contacts.length ?? 0) > 0 && (
              <CommandGroup heading={t("search.contacts")}>
                {data!.contacts.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={item.name}
                    keywords={["contact", item.company ?? ""]}
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
              <CommandGroup heading={t("search.meetings")}>
                {data!.meetings.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={item.title}
                    keywords={["meeting"]}
                    onSelect={() => navigate("/meetings")}
                  >
                    <CalendarDays />
                    {item.title}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {(data?.decisions.length ?? 0) > 0 && (
              <CommandGroup heading={t("search.decisions")}>
                {data!.decisions.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={item.title}
                    keywords={["decision"]}
                    onSelect={() => navigate("/decisions")}
                  >
                    <Scale />
                    {item.title}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {(data?.goals.length ?? 0) > 0 && (
              <CommandGroup heading={t("search.goals")}>
                {data!.goals.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={item.title}
                    keywords={["goal"]}
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
