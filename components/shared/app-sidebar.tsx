"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { MessageSquare, Plus, Trash2 } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { getMessage } from "@/lib/i18n";
import { type MessageDictionary } from "@/types/i18n";
import { type ChatSummary, CHAT_LIMIT } from "@/types/chat";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type AppSidebarProps = {
  messages: MessageDictionary;
};

export function AppSidebar({ messages }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const activeChatId = pathname.match(/^\/chat\/([^/]+)/)?.[1] ?? null;

  const fetchChats = useCallback(async () => {
    try {
      const res = await fetch("/api/chat");
      if (!res.ok) return;
      const data = (await res.json()) as { chats: ChatSummary[] };
      setChats(data.chats);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchChats();
  }, [fetchChats]);

  const handleNewChat = async () => {
    if (creating) return;
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
    const remaining = chats.filter((c) => c.id !== chatId);
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

  const atLimit = chats.length >= CHAT_LIMIT;

  return (
    <Sidebar collapsible="icon">
      {/* Header */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="gap-3">
              <MessageSquare className="size-5 shrink-0 text-primary" />
              <span className="font-semibold">
                {getMessage(messages, "chat.sidebar.title", "Chats")}
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
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
              {loading ? (
                <>
                  <SidebarMenuItem>
                    <SidebarMenuSkeleton showIcon />
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuSkeleton showIcon />
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuSkeleton showIcon />
                  </SidebarMenuItem>
                </>
              ) : chats.length === 0 ? (
                <p className="px-2 py-1.5 text-xs text-muted-foreground">
                  {getMessage(messages, "chat.sidebar.empty", "No chats yet.")}
                </p>
              ) : (
                chats.map((chat) => (
                  <SidebarMenuItem key={chat.id}>
                    <SidebarMenuButton
                      render={<Link href={`/chat/${chat.id}`} />}
                      isActive={chat.id === activeChatId}
                      tooltip={chat.title}
                      className="cursor-pointer"
                    >
                      <MessageSquare className="size-4 shrink-0" />
                      <span className="truncate">{chat.title}</span>
                    </SidebarMenuButton>
                    <SidebarMenuAction
                      showOnHover
                      onClick={() => setDeleteTarget(chat.id)}
                      aria-label={getMessage(
                        messages,
                        "chat.sidebar.delete",
                        "Delete",
                      )}
                      className="cursor-pointer"
                    >
                      <Trash2 className="size-3.5 text-destructive" />
                    </SidebarMenuAction>
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
    </Sidebar>
  );
}
