/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * SPDX-License-Identifier: Elastic-2.0
 */

"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  ChevronRight,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import {
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { type ChatSummary } from "@/types/chat";

const CHAT_GROUPS_KEY = "princeps:chat-groups-collapsed";

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

type SidebarChatsProps = {
  chats: ChatSummary[] | null;
  historyLimit: number;
  creating: boolean;
  deleteTarget: string | null;
  setDeleteTarget: (id: string | null) => void;
  renameTarget: string | null;
  setRenameTarget: (id: string | null) => void;
  renameValue: string;
  setRenameValue: (v: string) => void;
  activeChatId: string | null;
  handleNewChat: () => Promise<void>;
  handleDelete: (chatId: string) => Promise<void>;
  handleRename: (chatId: string) => Promise<void>;
  atLimit: boolean;
  isCollapsed: boolean;
  toggleSidebar: () => void;
};

export function SidebarChats({
  chats,
  historyLimit,
  creating,
  deleteTarget,
  setDeleteTarget,
  renameTarget,
  setRenameTarget,
  renameValue,
  setRenameValue,
  activeChatId,
  handleNewChat,
  handleDelete,
  handleRename,
  atLimit,
  isCollapsed,
  toggleSidebar,
}: SidebarChatsProps) {
  const t = useTranslations("chat");

  const [initialChatCollapsed] = useState<Record<string, boolean>>(() => {
    if (typeof window === "undefined") return {};
    return readLocalJson(CHAT_GROUPS_KEY);
  });

  const persistChatGroup = useCallback((group: string, open: boolean) => {
    const current = readLocalJson(CHAT_GROUPS_KEY);
    localStorage.setItem(
      CHAT_GROUPS_KEY,
      JSON.stringify({ ...current, [group]: !open }),
    );
  }, []);

  const groupedChats = chats ? groupChatsByDate(chats) : null;

  return (
    <>
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
                  isActive={activeChatId !== null}
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
    </>
  );
}
