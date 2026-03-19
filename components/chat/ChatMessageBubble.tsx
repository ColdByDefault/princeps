/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

"use client";

import { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { type ChatMessageData, type StreamingMessage } from "@/types/chat";

type Props = {
  message: ChatMessageData | StreamingMessage;
};

function isStreaming(
  m: ChatMessageData | StreamingMessage,
): m is StreamingMessage {
  return !("id" in m);
}

export default function ChatMessageBubble({ message }: Props) {
  const isUser = message.role === "user";
  const thinking = isStreaming(message) && message.isThinking;

  return (
    <div
      className={cn(
        "flex w-full gap-3",
        isUser ? "justify-end" : "justify-start",
      )}
    >
      {!isUser && (
        <div className="mt-1 flex size-7 shrink-0 items-center justify-center rounded-full border border-border/70 bg-primary/10 text-xs font-semibold text-primary">
          S
        </div>
      )}

      <div
        className={cn(
          "max-w-[80%] space-y-2 rounded-2xl px-4 py-3 text-sm leading-7",
          isUser
            ? "rounded-tr-sm bg-primary text-primary-foreground"
            : "rounded-tl-sm border border-border/60 bg-card/80",
        )}
      >
        {thinking ? (
          <ThinkingIndicator />
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none break-words">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        )}
      </div>

      {isUser && (
        <div className="mt-1 flex size-7 shrink-0 items-center justify-center rounded-full border border-border/70 bg-muted text-xs font-semibold text-muted-foreground">
          Y
        </div>
      )}
    </div>
  );
}

function ThinkingIndicator() {
  const progressRef = useRef<HTMLDivElement>(null);

  // Animate a bouncing progress bar while the model is thinking
  useEffect(() => {
    let value = 0;
    let direction = 1;

    const id = setInterval(() => {
      value += direction * 3;

      if (value >= 90) direction = -1;
      if (value <= 10) direction = 1;

      if (progressRef.current) {
        const indicator = progressRef.current.querySelector(
          "[data-slot='progress-indicator']",
        ) as HTMLElement | null;

        if (indicator) {
          indicator.style.transform = `translateX(-${100 - value}%)`;
        }
      }
    }, 60);

    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex flex-col gap-2 py-1">
      <p className="text-xs text-muted-foreground">Thinking…</p>
      <div ref={progressRef}>
        <Progress value={30} className="h-1 w-40" />
      </div>
    </div>
  );
}
