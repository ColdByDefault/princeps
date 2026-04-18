/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * SPDX-License-Identifier: Elastic-2.0
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  BookMarked,
  BrainCircuit,
  CalendarDays,
  CheckSquare,
  ChevronRight,
  ChevronUp,
  CreditCard,
  LayoutDashboard,
  LayoutGrid,
  LogOut,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Plus,
  Scale,
  Settings,
  Tag,
  Target,
  Trash2,
  User,
  Users,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { LanguageToggle, PlanBadge } from "@/components/shared";
import { ThemeToggle } from "@/components/theme";
import { type ChatSummary } from "@/types/chat";
import { GREETING_SESSION_KEY } from "@/hooks/use-notifications";

const CHAT_GROUPS_KEY = "princeps:chat-groups-collapsed";
const NAV_GROUPS_KEY = "princeps:nav-groups-collapsed";

const GROUP_KEYS = ["today", "yesterday", "last7", "older"] as const;
type GroupKey = (typeof GROUP_KEYS)[number];

function groupChatsByDate(
  chats: ChatSummary[],
): Record<GroupKey, ChatSummary[]> {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart.getTime() - 86_400_000);
  const sevenDaysStart = new Date(todayStart.getTime() - 7 * 86_400_000);
  const result: Record<GroupKey, ChatSummary[]> = {
    today: [],
    yesterday: [],
    last7: [],
    older: [],
  };
  for (const chat of chats) {
    const d = new Date(chat.updatedAt);
    if (d >= todayStart) result.today.push(chat);
    else if (d >= yesterdayStart) result.yesterday.push(chat);
    else if (d >= sevenDaysStart) result.last7.push(chat);
    else result.older.push(chat);
  }
  return result;
}

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

type AppSidebarProps = {
  sessionUser: {
    name: string | null;
    email: string | null;
  } | null;
  tier?: string | null;
};

export function AppSidebar({ sessionUser, tier }: AppSidebarProps) {
  const t = useTranslations("chat");
  const ts = useTranslations("shell");
  const pathname = usePathname();
  const router = useRouter();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";

  const [chats, setChats] = useState<ChatSummary[] | null>(null);
  const [historyLimit, setHistoryLimit] = useState<number>(10);
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [renameTarget, setRenameTarget] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Read initial collapsed state once at mount — defaultOpen is only used on first render
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

  const [initialChatCollapsed] = useState<Record<string, boolean>>(() => {
    if (typeof window === "undefined") return {};
    return readLocalJson(CHAT_GROUPS_KEY);
  });

  // Persist only — no state update, no re-render
  const persistNavGroup = useCallback((group: string, open: boolean) => {
    const current = readLocalJson(NAV_GROUPS_KEY);
    localStorage.setItem(
      NAV_GROUPS_KEY,
      JSON.stringify({ ...current, [group]: !open }),
    );
  }, []);

  const persistChatGroup = useCallback((group: string, open: boolean) => {
    const current = readLocalJson(CHAT_GROUPS_KEY);
    localStorage.setItem(
      CHAT_GROUPS_KEY,
      JSON.stringify({ ...current, [group]: !open }),
    );
  }, []);

  const activeChatId = pathname.match(/^\/chat\/([^/]+)/)?.[1] ?? null;

  const fetchChats = useCallback(async () => {
    try {
      const res = await fetch("/api/chat");
      if (!res.ok) return;
      const data = (await res.json()) as {
        chats: ChatSummary[];
        historyLimit: number;
      };
      setChats(data.chats);
      setHistoryLimit(data.historyLimit);
    } catch {
      setChats([]);
    }
  }, []);

  useEffect(() => {
    void fetchChats();
  }, [fetchChats]);

  useEffect(() => {
    const handler = () => {
      sessionStorage.removeItem("ssweet:pending-empty-chat");
      void fetchChats();
    };
    window.addEventListener("chat:updated", handler);
    return () => window.removeEventListener("chat:updated", handler);
  }, [fetchChats]);

  // Auto-delete an empty newly-created chat when the user navigates away
  useEffect(() => {
    const pending = sessionStorage.getItem("ssweet:pending-empty-chat");
    if (!pending) return;
    if (pathname.includes(pending)) return;
    sessionStorage.removeItem("ssweet:pending-empty-chat");
    void fetch(`/api/chat/${pending}`, { method: "DELETE" }).then((res) => {
      if (res.ok) {
        setChats((prev) => prev?.filter((c) => c.id !== pending) ?? prev);
      }
    });
  }, [pathname]);

  const handleNewChat = async () => {
    if (creating) return;
    const pending = sessionStorage.getItem("ssweet:pending-empty-chat");
    if (pending) {
      toast(t("sidebar.pendingEmpty"));
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/chat", { method: "POST" });
      if (res.status === 409) {
        toast.error(t("sidebar.limitReached"));
        return;
      }
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { chatId: string };
      sessionStorage.setItem("ssweet:pending-empty-chat", data.chatId);
      await fetchChats();
      router.push(`/chat/${data.chatId}`);
    } catch {
      toast.error(t("error.create"));
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (chatId: string) => {
    const res = await fetch(`/api/chat/${chatId}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error(t("error.delete"));
      return;
    }
    const remaining = (chats ?? []).filter((c) => c.id !== chatId);
    setChats(remaining);
    setDeleteTarget(null);
    toast.success(t("sidebar.deleteSuccess"));
    if (activeChatId === chatId) {
      router.push(remaining.length > 0 ? `/chat/${remaining[0].id}` : "/chat");
    }
  };

  const handleRename = async (chatId: string) => {
    const trimmed = renameValue.trim();
    setRenameTarget(null);
    if (!trimmed) return;
    const current = chats?.find((c) => c.id === chatId);
    if (current && trimmed === current.title) return;
    const res = await fetch(`/api/chat/${chatId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: trimmed }),
    });
    if (!res.ok) {
      toast.error(t("error.rename"));
      return;
    }
    setChats(
      (prev) =>
        prev?.map((c) => (c.id === chatId ? { ...c, title: trimmed } : c)) ??
        prev,
    );
    toast.success(t("sidebar.renameSuccess"));
  };

  const handleSignOut = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    const { authClient } = await import("@/lib/auth/auth-client");
    const result = await authClient.signOut();
    if (result.error) {
      setIsSigningOut(false);
      return;
    }
    sessionStorage.removeItem(GREETING_SESSION_KEY);
    router.replace("/");
    router.refresh();
  };

  const atLimit = (chats?.length ?? 0) >= historyLimit;
  const userLabel =
    sessionUser?.name?.trim() ||
    sessionUser?.email ||
    t("sidebar.userFallback");
  const groupedChats = chats ? groupChatsByDate(chats) : null;

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
    <Sidebar collapsible="icon">
      <SidebarContent>
        {/* Navigation */}
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

              {/* Collapsible nav groups — SidebarMenuSub hides in icon mode automatically */}
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

        <SidebarSeparator />

        {/* Chat list */}
        <SidebarGroup>
          <SidebarGroupLabel>
            {t("sidebar.title")}
            {!isCollapsed && chats !== null && (
              <span
                className={cn(
                  "ml-1.5 rounded px-1 py-0.5 text-xs tabular-nums",
                  chats.length >= historyLimit
                    ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {chats.length}/{historyLimit}
              </span>
            )}
          </SidebarGroupLabel>

          <SidebarGroupAction
            title={t("sidebar.newChat")}
            aria-label={t("sidebar.newChat")}
            onClick={() => void handleNewChat()}
            className={cn(
              "cursor-pointer",
              (atLimit || creating) && "pointer-events-none opacity-40",
            )}
          >
            <Plus className="size-4" />
          </SidebarGroupAction>

          <SidebarGroupContent>
            {isCollapsed ? (
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={pathname.startsWith("/chat")}
                    tooltip={t("sidebar.title")}
                    className="cursor-pointer"
                    onClick={toggleSidebar}
                  >
                    <MessageSquare className="size-4 shrink-0" />
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            ) : chats === null ? null : chats.length === 0 ? (
              <p className="px-2 py-1.5 text-xs text-muted-foreground">
                {t("sidebar.empty")}
              </p>
            ) : (
              GROUP_KEYS.map((groupKey) => {
                const items = groupedChats![groupKey];
                if (items.length === 0) return null;
                return (
                  <Collapsible
                    key={groupKey}
                    defaultOpen={!initialChatCollapsed[groupKey]}
                    onOpenChange={(open) => persistChatGroup(groupKey, open)}
                    className="group/collapsible"
                  >
                    <SidebarGroupLabel
                      render={<CollapsibleTrigger />}
                      className="cursor-pointer"
                    >
                      {t(`sidebar.groups.${groupKey}`)}
                      <ChevronRight className="ml-auto size-3.5 shrink-0 transition-transform duration-200 group-data-open/collapsible:rotate-90" />
                    </SidebarGroupLabel>
                    <CollapsibleContent>
                      <SidebarMenu>
                        {items.map((chat) => (
                          <SidebarMenuItem key={chat.id}>
                            {renameTarget === chat.id ? (
                              <form
                                className="flex w-full items-center px-2 py-1"
                                onSubmit={(e) => {
                                  e.preventDefault();
                                  void handleRename(chat.id);
                                }}
                              >
                                <input
                                  autoFocus
                                  className="flex-1 min-w-0 rounded-sm border border-input bg-background px-1.5 py-0.5 text-sm outline-none focus:ring-1 focus:ring-ring"
                                  value={renameValue}
                                  maxLength={80}
                                  placeholder={t("sidebar.renamePlaceholder")}
                                  onChange={(e) =>
                                    setRenameValue(e.target.value)
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === "Escape")
                                      setRenameTarget(null);
                                  }}
                                  onBlur={() => void handleRename(chat.id)}
                                />
                              </form>
                            ) : (
                              <>
                                <SidebarMenuButton
                                  render={<Link href={`/chat/${chat.id}`} />}
                                  isActive={chat.id === activeChatId}
                                  tooltip={chat.title}
                                  className="cursor-pointer"
                                >
                                  <MessageSquare className="size-4 shrink-0" />
                                  <span className="truncate">{chat.title}</span>
                                </SidebarMenuButton>
                                <DropdownMenu>
                                  <DropdownMenuTrigger
                                    render={
                                      <SidebarMenuAction
                                        showOnHover
                                        aria-label={t("sidebar.actions")}
                                        className="cursor-pointer"
                                      />
                                    }
                                  >
                                    <MoreHorizontal className="size-3.5" />
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent
                                    side="right"
                                    align="start"
                                  >
                                    <DropdownMenuItem
                                      className="cursor-pointer"
                                      disabled={chat.messageCount === 0}
                                      onClick={() => {
                                        setRenameTarget(chat.id);
                                        setRenameValue(chat.title);
                                      }}
                                    >
                                      <Pencil className="mr-2 size-3.5" />
                                      {t("sidebar.rename")}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="cursor-pointer text-destructive focus:text-destructive"
                                      disabled={chat.messageCount === 0}
                                      onClick={() => setDeleteTarget(chat.id)}
                                    >
                                      <Trash2 className="mr-2 size-3.5" />
                                      {t("sidebar.delete")}
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </>
                            )}
                          </SidebarMenuItem>
                        ))}
                      </SidebarMenu>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarRail />

      {/* Delete confirmation */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("sidebar.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("sidebar.deleteDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">
              {t("sidebar.deleteCancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              className="cursor-pointer bg-destructive text-white hover:bg-destructive/90"
              onClick={() => deleteTarget && void handleDelete(deleteTarget)}
            >
              {t("sidebar.deleteConfirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Footer */}
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
    </Sidebar>
  );
}
