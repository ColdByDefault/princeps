"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronUp,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Plus,
  Settings,
  SlidersHorizontal,
  Trash2,
  User,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarFooter,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { SettingsDialog } from "@/components/shared/SettingsDialog";
import ThemeToggle from "@/components/theme/ThemeToggle";
import { LanguageToggle } from "@/components/navigation/Navbar";
import { getMessage } from "@/lib/i18n";
import { type MessageDictionary } from "@/types/i18n";
import { type ChatSummary, CHAT_LIMIT } from "@/types/chat";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type AppSidebarProps = {
  messages: MessageDictionary;
  sessionUser: {
    name: string | null;
    email: string | null;
  } | null;
};

export function AppSidebar({ messages, sessionUser }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [chats, setChats] = useState<ChatSummary[] | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [renameTarget, setRenameTarget] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const activeChatId = pathname.match(/^\/chat\/([^/]+)/)?.[1] ?? null;
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";

  const fetchChats = useCallback(async () => {
    try {
      const res = await fetch("/api/chat");
      if (!res.ok) return;
      const data = (await res.json()) as { chats: ChatSummary[] };
      setChats(data.chats);
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
    // If there is already an unused empty chat, block and inform the user
    const pending = sessionStorage.getItem("ssweet:pending-empty-chat");
    if (pending) {
      toast(
        getMessage(
          messages,
          "chat.sidebar.pendingEmpty",
          "Start chatting first — empty chats are not saved.",
        ),
        {
          icon: (
            <span className="size-2 rounded-full bg-red-500 inline-block" />
          ),
        },
      );
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/chat", { method: "POST" });
      if (res.status === 409) {
        toast.error(
          getMessage(
            messages,
            "chat.sidebar.limitReached",
            "Delete a chat to create a new one",
          ),
        );
        return;
      }
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { chatId: string };
      sessionStorage.setItem("ssweet:pending-empty-chat", data.chatId);
      await fetchChats();
      router.push(`/chat/${data.chatId}`);
    } catch {
      toast.error("Failed to create chat");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (chatId: string) => {
    const res = await fetch(`/api/chat/${chatId}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Failed to delete chat");
      return;
    }
    const remaining = (chats ?? []).filter((c) => c.id !== chatId);
    setChats(remaining);
    setDeleteTarget(null);
    if (activeChatId === chatId) {
      if (remaining.length > 0) {
        router.push(`/chat/${remaining[0].id}`);
      } else {
        router.push("/chat");
      }
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
      toast.error("Failed to rename chat");
      return;
    }
    setChats(
      (prev) =>
        prev?.map((c) => (c.id === chatId ? { ...c, title: trimmed } : c)) ??
        prev,
    );
  };

  const atLimit = (chats?.length ?? 0) >= CHAT_LIMIT;

  const handleSignOut = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    const { authClient } = await import("@/lib/auth-client");
    const result = await authClient.signOut();
    if (result.error) {
      setIsSigningOut(false);
      return;
    }
    router.replace("/login");
    router.refresh();
  };

  const userLabel =
    sessionUser?.name?.trim() ||
    sessionUser?.email ||
    getMessage(messages, "shell.nav.userFallback", "Workspace user");

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        {/* Top navigation group */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  render={<Link href="/home" />}
                  isActive={pathname === "/home"}
                  tooltip={getMessage(messages, "shell.nav.home", "Workspace")}
                  className="cursor-pointer"
                >
                  <LayoutDashboard className="size-4 shrink-0" />
                  <span className="truncate">
                    {getMessage(messages, "shell.nav.home", "Workspace")}
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
            {isCollapsed ? (
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    tooltip={getMessage(
                      messages,
                      "shell.nav.appearance",
                      "Appearance",
                    )}
                    className="cursor-pointer"
                    onClick={toggleSidebar}
                  >
                    <SlidersHorizontal className="size-4 shrink-0" />
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            ) : (
              <div className="flex items-center gap-1 px-1 pt-1">
                <LanguageToggle messages={messages} />
                <ThemeToggle messages={messages} />
              </div>
            )}
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>
            {getMessage(messages, "chat.sidebar.title", "Chats")}
          </SidebarGroupLabel>

          {/* New chat button */}
          <SidebarGroupAction
            title={getMessage(messages, "chat.sidebar.newChat", "New chat")}
            aria-label={getMessage(
              messages,
              "chat.sidebar.newChat",
              "New chat",
            )}
            onClick={() => void handleNewChat()}
            className={cn(
              "cursor-pointer",
              (atLimit || creating) && "pointer-events-none opacity-40",
            )}
          >
            <Plus className="size-4" />
          </SidebarGroupAction>

          <SidebarGroupContent>
            <SidebarMenu>
              {isCollapsed ? (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={pathname.startsWith("/chat")}
                    tooltip={getMessage(
                      messages,
                      "chat.sidebar.title",
                      "Chats",
                    )}
                    className="cursor-pointer"
                    onClick={toggleSidebar}
                  >
                    <MessageSquare className="size-4 shrink-0" />
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ) : chats === null ? null : chats.length === 0 ? (
                <p className="px-2 py-1.5 text-xs text-muted-foreground">
                  {getMessage(messages, "chat.sidebar.empty", "No chats yet.")}
                </p>
              ) : (
                chats.map((chat) => (
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
                          placeholder={getMessage(
                            messages,
                            "chat.rename.placeholder",
                            "Chat title",
                          )}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Escape") setRenameTarget(null);
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
                                aria-label={getMessage(
                                  messages,
                                  "chat.sidebar.rename",
                                  "Rename",
                                )}
                                className="cursor-pointer"
                              />
                            }
                          >
                            <MoreHorizontal className="size-3.5" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent side="right" align="start">
                            <DropdownMenuItem
                              className="cursor-pointer"
                              onClick={() => {
                                setRenameTarget(chat.id);
                                setRenameValue(chat.title);
                              }}
                            >
                              <Pencil className="mr-2 size-3.5" />
                              {getMessage(
                                messages,
                                "chat.sidebar.rename",
                                "Rename",
                              )}
                            </DropdownMenuItem>
                            {chats.length > 1 && (
                              <DropdownMenuItem
                                className="cursor-pointer text-destructive focus:text-destructive"
                                onClick={() => setDeleteTarget(chat.id)}
                              >
                                <Trash2 className="mr-2 size-3.5" />
                                {getMessage(
                                  messages,
                                  "chat.sidebar.delete",
                                  "Delete",
                                )}
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </>
                    )}
                  </SidebarMenuItem>
                ))
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarRail />

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={getMessage(
          messages,
          "chat.sidebar.deleteTitle",
          "Delete this chat?",
        )}
        description={getMessage(
          messages,
          "chat.sidebar.deleteDescription",
          "This will permanently delete this chat and all its messages.",
        )}
        confirmLabel={getMessage(
          messages,
          "chat.sidebar.deleteConfirm",
          "Delete",
        )}
        cancelLabel={getMessage(messages, "shared.cancel", "Cancel")}
        confirmClassName="bg-destructive text-white hover:bg-destructive/90"
        onConfirm={() => deleteTarget && void handleDelete(deleteTarget)}
      />

      <SettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        messages={messages}
      />

      {/* Footer */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip={getMessage(messages, "shell.nav.settings", "Settings")}
              className="cursor-pointer"
              onClick={() => setSettingsOpen(true)}
            >
              <Settings className="size-4 shrink-0" />
              <span>
                {getMessage(messages, "shell.nav.settings", "Settings")}
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<SidebarMenuButton className="cursor-pointer" />}
              >
                {isCollapsed ? (
                  <User className="size-4 shrink-0" />
                ) : (
                  <>
                    <div className="flex flex-1 flex-col leading-none text-left overflow-hidden">
                      <span className="font-medium text-sm truncate">
                        {userLabel}
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
                  className="cursor-pointer text-destructive focus:text-destructive"
                  disabled={isSigningOut}
                  onClick={() => void handleSignOut()}
                >
                  <LogOut className="mr-2 size-4" />
                  {isSigningOut
                    ? getMessage(
                        messages,
                        "shell.nav.signingOut",
                        "Signing out...",
                      )
                    : getMessage(messages, "shell.nav.signOut", "Sign out")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
