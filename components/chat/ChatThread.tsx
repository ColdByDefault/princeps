/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

"use client";

import { useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import ChatMessageBubble from "@/components/chat/ChatMessageBubble";
import { type ChatMessageData, type StreamingMessage } from "@/types/chat";

type Props = {
  messages: ChatMessageData[];
  streamingMessage: StreamingMessage | null;
};

export default function ChatThread({ messages, streamingMessage }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new content
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingMessage?.content]);

  const isEmpty = messages.length === 0 && !streamingMessage;

  return (
    <ScrollArea className="flex-1 px-4 py-6">
      {isEmpty ? (
        <div className="flex h-full min-h-48 flex-col items-center justify-center gap-2 text-center">
          <p className="text-sm font-medium text-muted-foreground">
            Start a conversation
          </p>
          <p className="max-w-xs text-xs text-muted-foreground/70">
            Your assistant is aware of your workspace context and ready to help.
          </p>
        </div>
      ) : (
        <div className="mx-auto flex max-w-3xl flex-col gap-5">
          {messages.map((m) => (
            <ChatMessageBubble key={m.id} message={m} />
          ))}

          {streamingMessage && <ChatMessageBubble message={streamingMessage} />}

          <div ref={bottomRef} />
        </div>
      )}
    </ScrollArea>
  );
}
