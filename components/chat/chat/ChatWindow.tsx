/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version canary-v1.1.8
 * @since beta
 */

"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, CheckCircle2, Send } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/core/utils";
import { type ChatMessageData } from "@/types/chat";
import { useChatSettings } from "@/hooks/use-chat-settings";

// ─── Types ────────────────────────────────────────────────────────────────────

type ActivityItem =
  | { kind: "tool"; name: string }
  | { kind: "agent"; name: string; ok: boolean };

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
  const [activityMap, setActivityMap] = useState<
    Record<string, ActivityItem[]>
  >({});
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const inFlightRef = useRef(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { settings } = useChatSettings();

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
        body: JSON.stringify({
          message: text,
          temperature: settings.temperature,
          timeoutMs: settings.timeoutMs,
        }),
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
          let event: {
            type: string;
            text?: string;
            message?: string;
            name?: string;
            ok?: boolean;
          };
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
          } else if (event.type === "action" && event.name) {
            setActivityMap((prev) => ({
              ...prev,
              [assistantId]: [
                ...(prev[assistantId] ?? []),
                { kind: "tool", name: event.name! },
              ],
            }));
          } else if (event.type === "agent" && event.name) {
            setActivityMap((prev) => ({
              ...prev,
              [assistantId]: [
                ...(prev[assistantId] ?? []),
                { kind: "agent", name: event.name!, ok: event.ok ?? true },
              ],
            }));
          } else if (event.type === "done") {
            setMsgs((prev) =>
              prev.map((m) =>
                m.id === assistantId && "streaming" in m
                  ? {
                      id: m.id,
                      role: m.role,
                      content: m.content,
                      createdAt: m.createdAt,
                    }
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
      window.dispatchEvent(new CustomEvent("notifications:refresh"));
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
              <MessageBubble
                key={msg.id}
                msg={msg}
                activityItems={activityMap[msg.id]}
              />
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

// ─── Activity Bar ─────────────────────────────────────────────────────────────

/**
 * Single-line activity indicator shown above an assistant bubble.
 * While the message is still streaming it shows the latest tool / agent name
 * with an animated pulse dot and a "+N more" count.  Once streaming ends it
 * settles to a compact static summary line.
 */
function ActivityBar({
  items,
  isStreaming,
}: {
  items: ActivityItem[];
  isStreaming: boolean;
}) {
  if (items.length === 0) return null;

  const latest = items[items.length - 1];
  const count = items.length;
  const isAgent = latest.kind === "agent";

  return (
    <div className="flex items-center gap-1.5 px-1 py-0.5 text-[11px]">
      {isStreaming ? (
        <span className="size-1.5 shrink-0 rounded-full bg-emerald-500 animate-pulse" />
      ) : isAgent ? (
        <Bot className="size-3 shrink-0 text-violet-500 dark:text-violet-400" />
      ) : (
        <CheckCircle2 className="size-3 shrink-0 text-emerald-600 dark:text-emerald-400" />
      )}
      <span
        className={cn(
          "font-medium",
          isAgent
            ? "text-violet-600 dark:text-violet-400"
            : "text-emerald-700 dark:text-emerald-400",
        )}
      >
        {latest.name}
      </span>
      {count > 1 && (
        <span className="text-muted-foreground">· +{count - 1} more</span>
      )}
    </div>
  );
}

// ─── Message Bubble ───────────────────────────────────────────────────────────

function MessageBubble({
  msg,
  activityItems,
}: {
  msg: LiveMessage;
  activityItems?: ActivityItem[];
}) {
  const isUser = msg.role === "user";
  const isStreamingEmpty = "streaming" in msg && msg.streaming && !msg.content;
  const isStreaming = "streaming" in msg && !!msg.streaming;
  const items = activityItems ?? [];

  return (
    <div
      className={cn(
        "flex w-full flex-col gap-1",
        isUser ? "items-end" : "items-start",
      )}
    >
      {/* Single-line activity bar — replaces the old stacking pill group */}
      {!isUser && items.length > 0 && (
        <ActivityBar items={items} isStreaming={isStreaming} />
      )}
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
        ) : isUser ? (
          <p className="whitespace-pre-wrap wrap-break-word">{msg.content}</p>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-ol:my-1 prose-li:my-0 prose-pre:my-2 prose-code:before:content-none prose-code:after:content-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                a: ({ href, children }) => (
                  <Link
                    href={href ?? "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 underline underline-offset-2 hover:text-blue-400 cursor-pointer"
                  >
                    {children}
                  </Link>
                ),
              }}
            >
              {msg.content}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}

