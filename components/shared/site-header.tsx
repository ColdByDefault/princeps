/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

"use client";

import { useEffect, useState } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { CHAT_LIMIT } from "@/types/chat";
import { type ChatSummary } from "@/types/chat";

type StatusData = {
  ollama: boolean;
  chatModel: string;
  embedModel: string | null;
};

export function SiteHeader() {
  const [status, setStatus] = useState<StatusData | null>(null);
  const [chatCount, setChatCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchStatus() {
      try {
        const res = await fetch("/api/status");
        if (res.ok) {
          const data = (await res.json()) as StatusData;
          if (!cancelled) setStatus(data);
        }
      } catch {
        // silently ignore
      }
    }

    async function fetchChatCount() {
      try {
        const res = await fetch("/api/chat");
        if (res.ok) {
          const data = (await res.json()) as { chats: ChatSummary[] };
          if (!cancelled) setChatCount(data.chats.length);
        }
      } catch {
        // silently ignore
      }
    }

    void fetchStatus();
    void fetchChatCount();

    const interval = setInterval(() => void fetchStatus(), 30_000);
    const handler = () => void fetchChatCount();
    window.addEventListener("chat:updated", handler);

    return () => {
      cancelled = true;
      clearInterval(interval);
      window.removeEventListener("chat:updated", handler);
    };
  }, []);

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4">
      <SidebarTrigger className="-ml-1 cursor-pointer" />

      <div className="ml-auto flex items-center gap-2">
        {/* Chat counter */}
        {chatCount !== null && (
          <Badge variant="secondary" className="gap-1 text-xs font-normal">
            <span>Chats</span>
            <span className="font-semibold">
              {chatCount}/{CHAT_LIMIT}
            </span>
          </Badge>
        )}

        {/* Ollama status */}
        {status !== null && (
          <Badge variant="secondary" className="gap-1.5 text-xs font-normal">
            <span
              className={
                status.ollama
                  ? "size-2 rounded-full bg-emerald-500"
                  : "size-2 rounded-full bg-red-500"
              }
            />
            <span className="font-medium">{status.chatModel}</span>
            {status.embedModel && (
              <>
                <span className="text-muted-foreground">·</span>
                <span className="text-muted-foreground">
                  {status.embedModel}
                </span>
              </>
            )}
          </Badge>
        )}
      </div>
    </header>
  );
}
