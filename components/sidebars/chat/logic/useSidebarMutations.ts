/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version beta
 * @since beta
 * @module
 * @description
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { GREETING_SESSION_KEY } from "@/hooks/use-notifications";
import { type ChatSummary } from "@/types/chat";

export function useSidebarMutations() {
  const t = useTranslations("chat");
  const router = useRouter();
  const pathname = usePathname();

  const [chats, setChats] = useState<ChatSummary[] | null>(null);
  const [historyLimit, setHistoryLimit] = useState<number>(10);
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [renameTarget, setRenameTarget] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [isSigningOut, setIsSigningOut] = useState(false);

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

  return {
    chats,
    setChats,
    historyLimit,
    fetchChats,
    creating,
    deleteTarget,
    setDeleteTarget,
    renameTarget,
    setRenameTarget,
    renameValue,
    setRenameValue,
    isSigningOut,
    activeChatId,
    handleNewChat,
    handleDelete,
    handleRename,
    handleSignOut,
    atLimit: (chats?.length ?? 0) >= historyLimit,
  };
}
