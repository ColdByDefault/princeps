/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Send, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { getMessage } from "@/lib/i18n";
import { type ChatMessageData } from "@/types/chat";
import { type MessageDictionary } from "@/types/i18n";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// localStorage-backed think toggle store
// ---------------------------------------------------------------------------
const THINK_KEY = "ssweet:think";

function subscribeThink(cb: () => void) {
  window.addEventListener("ssweet:think-changed", cb);
  return () => window.removeEventListener("ssweet:think-changed", cb);
}
function getThinkSnapshot() {
  try {
    return localStorage.getItem(THINK_KEY) === "true";
  } catch {
    return false;
  }
}
function setThinkPersisted(value: boolean) {
  try {
    localStorage.setItem(THINK_KEY, String(value));
  } catch {
    // ignore — storage unavailable
  }
  window.dispatchEvent(new Event("ssweet:think-changed"));
}

type Props = {
  chatId: string;
  initialMessages: ChatMessageData[];
  messages: MessageDictionary;
};

type LiveMessage =
  | (ChatMessageData & { streaming?: false; hadThinking?: boolean })
  | {
      id: string;
      role: "user" | "assistant";
      content: string;
      createdAt: string;
      streaming: true;
      isThinking: boolean;
    };

export function ChatWindow({ chatId, initialMessages, messages }: Props) {
  const [msgs, setMsgs] = useState<LiveMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const think = useSyncExternalStore(
    subscribeThink,
    getThinkSnapshot,
    () => false,
  );
  const [streaming, setStreaming] = useState(false);
  const inFlightRef = useRef(false);
  const hadThinkingRef = useRef(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || inFlightRef.current) return;
    inFlightRef.current = true;

    setInput("");
    setStreaming(true);

    // Optimistically add user message
    const userMsg: LiveMessage = {
      id: `tmp-user-${Date.now()}`,
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
    };
    setMsgs((prev) => [...prev, userMsg]);

    // Placeholder for assistant response
    hadThinkingRef.current = false;
    const assistantId = `tmp-assistant-${Date.now()}`;
    const assistantPlaceholder: LiveMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
      createdAt: new Date().toISOString(),
      streaming: true,
      isThinking: false,
    };
    setMsgs((prev) => [...prev, assistantPlaceholder]);

    try {
      const response = await fetch(`/api/chat/${chatId}/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, think }),
      });

      if (!response.ok || !response.body) {
        throw new Error("Stream failed");
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

          if (event.type === "thinking") {
            hadThinkingRef.current = true;
            setMsgs((prev) =>
              prev.map((m) =>
                m.id === assistantId && "streaming" in m && m.streaming
                  ? { ...m, isThinking: true }
                  : m,
              ),
            );
          } else if (event.type === "token" && event.text) {
            setMsgs((prev) =>
              prev.map((m) =>
                m.id === assistantId && "streaming" in m && m.streaming
                  ? { ...m, content: m.content + event.text, isThinking: false }
                  : m,
              ),
            );
          } else if (event.type === "done") {
            const usedThinking = hadThinkingRef.current;
            setMsgs((prev) =>
              prev.map((m) =>
                m.id === assistantId && "streaming" in m && m.streaming
                  ? {
                      ...m,
                      streaming: false,
                      isThinking: false,
                      hadThinking: usedThinking,
                    }
                  : m,
              ),
            );
          } else if (event.type === "error") {
            throw new Error(event.message ?? "Stream error");
          }
        }
      }
    } catch {
      // Remove the placeholder on error
      setMsgs((prev) => prev.filter((m) => m.id !== assistantId));
      toast.error(
        getMessage(
          messages,
          "chat.error.send",
          "Failed to send message. Please try again.",
        ),
      );
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

  const isEmpty = msgs.length === 0;

  return (
    <div className="flex flex-1 min-h-0 flex-col">
      {/* Message list — only this scrolls */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-6">
        {isEmpty ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
            <p className="text-base font-medium text-foreground">
              {getMessage(messages, "chat.empty.title", "Start a conversation")}
            </p>
            <p className="text-sm text-muted-foreground">
              {getMessage(
                messages,
                "chat.empty.body",
                "Send a message to begin.",
              )}
            </p>
          </div>
        ) : (
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
            {msgs.map((msg) => (
              <MessageBubble
                key={msg.id}
                msg={msg}
                thinkingLabel={getMessage(
                  messages,
                  "chat.thinking",
                  "Thinking…",
                )}
                reasonedLabel={getMessage(
                  messages,
                  "chat.reasoned",
                  "Model reasoned",
                )}
              />
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input bar */}
      <div className="border-t bg-background px-4 py-4">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-2">
          <div className="flex items-end gap-2 rounded-xl border bg-background/80 p-2 shadow-sm backdrop-blur-sm">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={getMessage(
                messages,
                "chat.input.placeholder",
                "Ask anything…",
              )}
              rows={1}
              disabled={streaming}
              className="min-h-10 flex-1 resize-none border-0 bg-transparent p-1 shadow-none focus-visible:ring-0"
            />
            <div className="flex shrink-0 items-center gap-2">
              <Tooltip>
                <TooltipTrigger
                  render={
                    <label className="flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground select-none">
                      <Brain className="size-3.5" />
                      <span className="hidden sm:inline">
                        {getMessage(messages, "chat.input.think", "Think")}
                      </span>
                      <Switch
                        checked={think}
                        onCheckedChange={setThinkPersisted}
                        disabled={streaming}
                        aria-label={getMessage(
                          messages,
                          "chat.input.thinkTooltip",
                          "Enable extended reasoning",
                        )}
                        className="scale-75"
                      />
                    </label>
                  }
                />
                <TooltipContent side="top">
                  {getMessage(
                    messages,
                    "chat.input.thinkTooltip",
                    "Enable extended reasoning",
                  )}
                </TooltipContent>
              </Tooltip>

              <Button
                type="button"
                size="icon"
                onClick={() => void sendMessage()}
                disabled={streaming || !input.trim()}
                aria-label={getMessage(messages, "chat.input.send", "Send")}
                className="size-9 cursor-pointer rounded-lg"
              >
                <Send className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

type BubbleProps = {
  msg: LiveMessage;
  thinkingLabel: string;
  reasonedLabel: string;
};

function MessageBubble({ msg, thinkingLabel, reasonedLabel }: BubbleProps) {
  const isUser = msg.role === "user";
  const isThinking = "isThinking" in msg && msg.isThinking;
  const isStreamingEmpty = "streaming" in msg && msg.streaming && !msg.content;
  const hadThinking = "hadThinking" in msg && msg.hadThinking;

  return (
    <div
      className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}
    >
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
          isUser
            ? "rounded-tr-sm bg-primary text-primary-foreground"
            : "rounded-tl-sm bg-muted text-foreground",
        )}
      >
        {isThinking || isStreamingEmpty ? (
          <div className="flex flex-col gap-2 py-1 w-40">
            <span className="text-xs text-muted-foreground italic">
              {thinkingLabel}
            </span>
            <Progress value={null} className="w-full" />
          </div>
        ) : (
          <>
            {hadThinking && (
              <span className="mb-2 inline-flex items-center gap-1 rounded-full border border-muted-foreground/20 bg-muted/60 px-2 py-0.5 text-xs text-muted-foreground">
                <Brain className="size-3" />
                {reasonedLabel}
              </span>
            )}
            <p className="whitespace-pre-wrap wrap-break-word">{msg.content}</p>
          </>
        )}
      </div>
    </div>
  );
}
