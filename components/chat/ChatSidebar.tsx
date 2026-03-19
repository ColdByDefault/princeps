/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  MessageSquarePlus,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/shared";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { type ChatSummary } from "@/types/chat";
import { type MessageDictionary } from "@/types/i18n";
import { getMessage } from "@/lib/i18n";

type Props = {
  chats: ChatSummary[];
  activeChatId: string | null;
  atLimit: boolean;
  messages: MessageDictionary;
};

export default function ChatSidebar({
  chats,
  activeChatId,
  atLimit,
  messages,
}: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleNewChat = async () => {
    if (atLimit || isCreating) return;

    setIsCreating(true);

    try {
      const res = await fetch("/api/chat", { method: "POST" });
      const data = (await res.json()) as { chatId?: string; error?: string };

      if (res.ok && data.chatId) {
        startTransition(() => {
          router.push(`/chat/${data.chatId}`);
          router.refresh();
        });
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (chatId: string) => {
    await fetch(`/api/chat/${chatId}`, { method: "DELETE" });

    startTransition(() => {
      if (activeChatId === chatId) {
        router.push("/chat");
      }

      router.refresh();
    });

    setDeletingId(null);
  };

  const handleRenameSubmit = async (chatId: string) => {
    const title = renameValue.trim();

    if (!title) return;

    await fetch(`/api/chat/${chatId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });

    startTransition(() => router.refresh());
    setRenamingId(null);
    setRenameValue("");
  };

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-border/60 bg-card/50">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
        <span className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
          {getMessage(messages, "chat.sidebar.title", "Chats")}
        </span>

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={getMessage(messages, "chat.sidebar.newChat", "New chat")}
          disabled={atLimit || isCreating}
          onClick={handleNewChat}
          className="cursor-pointer rounded-xl"
          title={
            atLimit
              ? getMessage(
                  messages,
                  "chat.sidebar.limitReached",
                  "Delete a chat to create a new one",
                )
              : undefined
          }
        >
          <MessageSquarePlus className="size-4" />
        </Button>
      </div>

      {/* Limit notice */}
      {atLimit && (
        <div className="mx-3 mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-600 dark:text-amber-400">
          {getMessage(
            messages,
            "chat.sidebar.limitNotice",
            "10 chat limit reached. Delete one to start a new chat.",
          )}
        </div>
      )}

      {/* Chat list */}
      <ScrollArea className="flex-1 py-2">
        {chats.length === 0 ? (
          <p className="px-4 py-6 text-center text-xs text-muted-foreground/60">
            {getMessage(messages, "chat.sidebar.empty", "No chats yet.")}
          </p>
        ) : (
          <nav className="space-y-0.5 px-2">
            {chats.map((chat) => {
              const isActive = chat.id === activeChatId;

              return (
                <div key={chat.id} className="group relative flex items-center">
                  {renamingId === chat.id ? (
                    <input
                      autoFocus
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onBlur={() => {
                        setRenamingId(null);
                        setRenameValue("");
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          void handleRenameSubmit(chat.id);
                        }

                        if (e.key === "Escape") {
                          setRenamingId(null);
                          setRenameValue("");
                        }
                      }}
                      className="w-full rounded-xl border border-primary/40 bg-background px-3 py-1.5 text-sm outline-none"
                    />
                  ) : (
                    <>
                      <Button
                        variant={isActive ? "secondary" : "ghost"}
                        size="sm"
                        className={cn(
                          "w-full cursor-pointer justify-start truncate rounded-xl pr-7 text-left text-sm",
                          isActive && "shadow-sm",
                        )}
                        nativeButton={false}
                        render={<a href={`/chat/${chat.id}`} />}
                      >
                        <span className="truncate">{chat.title}</span>
                      </Button>

                      {/* Per-chat actions */}
                      <DropdownMenu>
                        <DropdownMenuTrigger>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Chat options"
                            className={cn(
                              "absolute right-1 cursor-pointer rounded-lg opacity-0 transition-opacity group-hover:opacity-100",
                              isActive && "opacity-100",
                            )}
                          >
                            <MoreHorizontal className="size-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="min-w-36 rounded-xl border-border/70 bg-background/92 backdrop-blur-xl"
                        >
                          <DropdownMenuItem
                            className="cursor-pointer rounded-lg"
                            onClick={() => {
                              setRenamingId(chat.id);
                              setRenameValue(chat.title);
                            }}
                          >
                            <Pencil className="size-3.5" />
                            {getMessage(
                              messages,
                              "chat.sidebar.rename",
                              "Rename",
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="cursor-pointer rounded-lg text-destructive focus:text-destructive"
                            onClick={() => setDeletingId(chat.id)}
                          >
                            <Trash2 className="size-3.5" />
                            {getMessage(
                              messages,
                              "chat.sidebar.delete",
                              "Delete",
                            )}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </>
                  )}
                </div>
              );
            })}
          </nav>
        )}
      </ScrollArea>

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deletingId}
        onOpenChange={(open) => {
          if (!open) setDeletingId(null);
        }}
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
        onConfirm={() => {
          if (deletingId) void handleDelete(deletingId);
        }}
      />
    </aside>
  );
}
