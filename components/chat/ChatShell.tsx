/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ChatSidebar from "@/components/chat/ChatSidebar";
import ChatThread from "@/components/chat/ChatThread";
import ChatInput from "@/components/chat/ChatInput";
import { CHAT_LIMIT } from "@/types/chat";
import {
  type ChatSummary,
  type ChatMessageData,
  type StreamingMessage,
} from "@/types/chat";
import { type MessageDictionary } from "@/types/i18n";

type Props = {
  chats: ChatSummary[];
  activeChatId: string;
  initialMessages: ChatMessageData[];
  messages: MessageDictionary;
  atLimit: boolean;
};

type SSEEvent =
  | { type: "thinking" }
  | { type: "token"; text: string }
  | { type: "done" }
  | { type: "error"; message: string };

export default function ChatShell({
  chats: initialChats,
  activeChatId,
  initialMessages,
  messages,
  atLimit: initialAtLimit,
}: Props) {
  const router = useRouter();
  const [chatMessages, setChatMessages] =
    useState<ChatMessageData[]>(initialMessages);
  const [streamingMessage, setStreamingMessage] =
    useState<StreamingMessage | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [chats, setChats] = useState<ChatSummary[]>(initialChats);

  const atLimit = initialAtLimit || chats.length >= CHAT_LIMIT;

  const handleSend = async (text: string, think: boolean) => {
    if (isStreaming) return;

    // Optimistically add user message to the thread
    const optimisticUser: ChatMessageData = {
      id: `opt-${Date.now()}`,
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
    };

    setChatMessages((prev) => [...prev, optimisticUser]);
    setIsStreaming(true);

    // Start the assistant streaming placeholder
    setStreamingMessage({ role: "assistant", content: "", isThinking: false });

    try {
      const res = await fetch(`/api/chat/${activeChatId}/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, think }),
      });

      if (!res.ok || !res.body) {
        setStreamingMessage((prev) =>
          prev
            ? {
                ...prev,
                content: "Assistant is unavailable. Is Ollama running?",
                isThinking: false,
              }
            : null,
        );
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;

          const raw = line.slice(6).trim();

          if (!raw) continue;

          let event: SSEEvent;

          try {
            event = JSON.parse(raw) as SSEEvent;
          } catch {
            continue;
          }

          if (event.type === "thinking") {
            setStreamingMessage((prev) =>
              prev ? { ...prev, isThinking: true } : null,
            );
          } else if (event.type === "token") {
            setStreamingMessage((prev) =>
              prev
                ? {
                    ...prev,
                    content: prev.content + event.text,
                    isThinking: false,
                  }
                : null,
            );
          } else if (event.type === "done") {
            streamDone = true;
            break;
          } else if (event.type === "error") {
            setStreamingMessage((prev) =>
              prev
                ? {
                    ...prev,
                    content: prev.content || "An error occurred.",
                    isThinking: false,
                  }
                : null,
            );
            streamDone = true;
            break;
          }
        }
      }
    } catch {
      setStreamingMessage((prev) =>
        prev
          ? {
              ...prev,
              content: "Connection error. Try again.",
              isThinking: false,
            }
          : null,
      );
    } finally {
      // Flush the streamed message into the persisted list
      setStreamingMessage((prev) => {
        if (prev && prev.content) {
          const finalMsg: ChatMessageData = {
            id: `streamed-${Date.now()}`,
            role: "assistant",
            content: prev.content,
            createdAt: new Date().toISOString(),
          };

          setChatMessages((msgs) => [...msgs, finalMsg]);
        }

        return null;
      });

      setIsStreaming(false);

      // Refresh sidebar to update title and ordering (after first message)
      router.refresh();

      // Re-sync chats list
      try {
        const r = await fetch("/api/chat");
        const data = (await r.json()) as { chats?: ChatSummary[] };

        if (data.chats) setChats(data.chats);
      } catch {
        // non-critical
      }
    }
  };

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden rounded-none">
      {/* Sidebar */}
      <ChatSidebar
        chats={chats}
        activeChatId={activeChatId}
        atLimit={atLimit}
        messages={messages}
      />

      {/* Main area */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-card/20">
        {/* Chat header */}
        <div className="flex h-11 shrink-0 items-center border-b border-border/60 bg-background/60 px-4 backdrop-blur-sm">
          <span className="truncate text-sm font-medium text-foreground/80">
            {chats.find((c) => c.id === activeChatId)?.title ?? "New chat"}
          </span>
        </div>

        <ChatThread
          messages={chatMessages}
          streamingMessage={streamingMessage}
        />

        <ChatInput
          messages={messages}
          disabled={isStreaming}
          onSend={(text, think) => void handleSend(text, think)}
        />
      </div>
    </div>
  );
}
