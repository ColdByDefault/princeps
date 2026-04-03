/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

"use client";

import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { type ChatMessageData } from "@/types/chat";

// ─── Types ────────────────────────────────────────────────────────────────────

type LiveMessage =
  | ChatMessageData
  | {
      id: string;
      role: "assistant";
      content: string;
      createdAt: string;
      streaming: true;
    };

type Props = {
  chatId: string;
  initialMessages: ChatMessageData[];
};

// ─── Component ────────────────────────────────────────────────────────────────

export function ChatWindow({ chatId, initialMessages }: Props) {
  const t = useTranslations("chat");
  const [msgs, setMsgs] = useState<LiveMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const inFlightRef = useRef(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || inFlightRef.current) return;
    inFlightRef.current = true;
    setInput("");
    setStreaming(true);

    const userMsg: LiveMessage = {
      id: `tmp-user-${Date.now()}`,
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
    };

    const assistantId = `tmp-assistant-${Date.now()}`;
    const assistantPlaceholder: LiveMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
      createdAt: new Date().toISOString(),
      streaming: true,
    };

    setMsgs((prev) => [...prev, userMsg, assistantPlaceholder]);

    try {
      const response = await fetch(`/api/chat/${chatId}/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      if (!response.ok || !response.body) {
        let errMsg: string | undefined;
        try {
          const errBody = (await response.json()) as { error?: string };
          errMsg = errBody.error;
        } catch {
          // ignore
        }
        throw new Error(errMsg ?? "Stream failed");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split("\n\n");
        buffer = chunks.pop() ?? "";

        for (const chunk of chunks) {
          if (!chunk.startsWith("data: ")) continue;
          let event: { type: string; text?: string; message?: string };
          try {
            event = JSON.parse(chunk.slice(6)) as typeof event;
          } catch {
            continue;
          }

          if (event.type === "token" && event.text) {
            setMsgs((prev) =>
              prev.map((m) =>
                m.id === assistantId && "streaming" in m
                  ? { ...m, content: m.content + event.text }
                  : m,
              ),
            );
          } else if (event.type === "done") {
            setMsgs((prev) =>
              prev.map((m) =>
                m.id === assistantId && "streaming" in m
                  ? { id: m.id, role: m.role, content: m.content, createdAt: m.createdAt }
                  : m,
              ),
            );
          } else if (event.type === "error") {
            throw new Error(event.message ?? "Stream error");
          }
        }
      }
    } catch (err) {
      setMsgs((prev) => prev.filter((m) => m.id !== assistantId));
      const specific =
        err instanceof Error &&
        err.message !== "Stream failed" &&
        err.message !== "Stream error"
          ? err.message
          : undefined;
      toast.error(specific ?? t("error.send"));
    } finally {
      inFlightRef.current = false;
      setStreaming(false);
      textareaRef.current?.focus();
      window.dispatchEvent(new CustomEvent("chat:updated"));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage();
    }
  };

  return (
    <div className="flex flex-1 min-h-0 flex-col">
      {/* Message list */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-6">
        {msgs.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
            <p className="text-base font-medium text-foreground">
              {t("empty.title")}
            </p>
            <p className="text-sm text-muted-foreground">{t("empty.body")}</p>
          </div>
        ) : (
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
            {msgs.map((msg) => (
              <MessageBubble key={msg.id} msg={msg} />
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input bar */}
      <div className="border-t bg-background px-4 py-4">
        <div className="mx-auto flex w-full max-w-3xl items-end gap-2 rounded-xl border bg-background/80 p-2 shadow-sm backdrop-blur-sm">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t("input.placeholder")}
            rows={1}
            disabled={streaming}
            className="min-h-10 flex-1 resize-none border-0 bg-transparent p-1 shadow-none focus-visible:ring-0"
          />
          <Button
            type="button"
            size="icon"
            onClick={() => void sendMessage()}
            disabled={streaming || !input.trim()}
            aria-label={t("input.send")}
            className="size-9 cursor-pointer rounded-lg shrink-0"
          >
            <Send className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Message Bubble ───────────────────────────────────────────────────────────

function MessageBubble({ msg }: { msg: LiveMessage }) {
  const isUser = msg.role === "user";
  const isStreamingEmpty =
    "streaming" in msg && msg.streaming && !msg.content;

  return (
    <div className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
          isUser
            ? "rounded-tr-sm bg-primary text-primary-foreground"
            : "rounded-tl-sm bg-muted text-foreground",
        )}
      >
        {isStreamingEmpty ? (
          <span className="inline-block h-4 w-4 animate-pulse rounded-full bg-current opacity-40" />
        ) : (
          <p className="whitespace-pre-wrap wrap-break-word">{msg.content}</p>
        )}
      </div>
    </div>
  );
}
