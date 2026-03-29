/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { X, Send, Minus, Bot, ChevronDown, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────
interface ChatWidgetProps {
  assistantName?: string | undefined;
}

interface Message {
  id: number;
  text: string;
  sender: "user" | "assistant" | "action";
  time: string;
  /** Populated only when sender === "action" */
  actionLabel?: string;
}

type HistoryEntry = { role: "user" | "assistant"; content: string };

type SseEvent =
  | { type: "token"; text: string }
  | { type: "done" }
  | { type: "error"; message: string }
  | { type: "action"; name: string; record: Record<string, unknown> };

function getTime() {
  return new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });
}

// ─── Component ────────────────────────────────────────────────────────────────
export function ChatWidget({ assistantName = "Atlas" }: ChatWidgetProps) {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [progress, setProgress] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [mounted, setMounted] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // Keep a ref of the current message list for use inside async callbacks
  const messagesRef = useRef<Message[]>([]);
  messagesRef.current = messages;

  // Hydration-safe init
  useEffect(() => {
    setMessages([
      {
        id: 1,
        text: `Hi! I'm ${assistantName}, your personal assistant. How can I help you today?`,
        sender: "assistant",
        time: getTime(),
      },
    ]);
    setMounted(true);
  }, [assistantName]);

  // Scroll to latest message
  useEffect(() => {
    if (mounted) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking, mounted]);

  // Focus input when opened
  useEffect(() => {
    if (open && !minimized) setTimeout(() => inputRef.current?.focus(), 150);
  }, [open, minimized]);

  // Thinking progress bar
  useEffect(() => {
    if (!thinking) {
      setProgress(0);
      return;
    }
    const id = setInterval(() => {
      setProgress((p) => (p >= 88 ? p : p + Math.random() * 12));
    }, 180);
    return () => clearInterval(id);
  }, [thinking]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || thinking) return;

    const userMsg: Message = {
      id: Date.now(),
      text,
      sender: "user",
      time: getTime(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setThinking(true);
    setProgress(0);

    // Build history from all messages currently in view (excluding the greeting and action cards)
    const history: HistoryEntry[] = messagesRef.current
      .filter((m) => m.id !== 1 && m.sender !== "action")
      .map((m) => ({
        role: m.sender as "user" | "assistant",
        content: m.text,
      }));
    // Include the new user message in the history sent to the backend
    history.push({ role: "user", content: text });

    const assistantId = Date.now() + 1;
    let accumulated = "";
    let firstToken = true;

    try {
      const res = await fetch("/api/chat/widget", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history: history.slice(0, -1) }),
      });

      if (!res.ok || !res.body) {
        throw new Error("Request failed");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";

        for (const part of parts) {
          const line = part.startsWith("data: ") ? part.slice(6) : part;
          if (!line.trim()) continue;

          let event: SseEvent;
          try {
            event = JSON.parse(line) as SseEvent;
          } catch {
            continue;
          }

          if (event.type === "token") {
            accumulated += event.text;
            if (firstToken) {
              firstToken = false;
              setThinking(false);
              setMessages((prev) => [
                ...prev,
                {
                  id: assistantId,
                  text: accumulated,
                  sender: "assistant",
                  time: getTime(),
                },
              ]);
            } else {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId ? { ...m, text: accumulated } : m,
                ),
              );
            }
          } else if (event.type === "action") {
            const actionNameMap: Record<string, string> = {
              create_contact: "Contact created",
              create_meeting: "Meeting created",
              create_task: "Task created",
              create_decision: "Decision logged",
            };
            const label = actionNameMap[event.name] ?? event.name;
            const record = event.record as { name?: string; title?: string };
            const recordName = record.name ?? record.title ?? null;
            setMessages((prev) => [
              ...prev,
              {
                id: Date.now(),
                text: recordName ? `${label}: ${recordName}` : label,
                sender: "action",
                time: getTime(),
                actionLabel: label,
              },
            ]);
          } else if (event.type === "done") {
            break;
          } else if (event.type === "error") {
            throw new Error(event.message);
          }
        }
      }
    } catch {
      if (firstToken) {
        // No message was added yet — insert one with the error text
        setMessages((prev) => [
          ...prev,
          {
            id: assistantId,
            text: "Something went wrong. Please try again.",
            sender: "assistant",
            time: getTime(),
          },
        ]);
      } else {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, text: "Something went wrong. Please try again." }
              : m,
          ),
        );
      }
    } finally {
      setThinking(false);
    }
  }, [input, thinking]);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const toggleOpen = () => {
    if (minimized) {
      setMinimized(false);
      return;
    }
    setOpen((v) => !v);
  };

  const isVisible = open && !minimized;

  return (
    <div className="fixed bottom-6 left-6 z-50 flex flex-col items-start">
      {/* ── Chat Window ────────────────────────────────────────────────────── */}
      <div
        className={cn(
          "mb-3 flex w-90 flex-col overflow-hidden rounded-2xl border shadow-2xl transition-all duration-300 ease-out",
          // Light / dark surfaces via semantic tokens
          "border-border bg-card",
          isVisible
            ? "h-120 opacity-100 translate-y-0"
            : "h-0 opacity-0 translate-y-3 pointer-events-none",
        )}
        aria-hidden={!isVisible}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between bg-primary px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15">
              <Bot className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-none text-primary-foreground">
                {assistantName}
              </p>
              <p className="mt-0.5 text-[11px] text-primary-foreground/65">
                Personal assistant
              </p>
            </div>
          </div>

          <div className="flex items-center gap-0.5">
            <button
              onClick={() => setMinimized(true)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-primary-foreground/70 transition-colors hover:bg-white/10 hover:text-primary-foreground"
              aria-label="Minimize"
            >
              <Minus className="h-4 w-4" />
            </button>
            <button
              onClick={() => setOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-primary-foreground/70 transition-colors hover:bg-white/10 hover:text-primary-foreground"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto bg-muted/20 px-4 py-4">
          {!mounted ? (
            <div className="flex h-full items-center justify-center">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex flex-col",
                    msg.sender === "user" ? "items-end" : "items-start",
                  )}
                >
                  {msg.sender === "action" ? (
                    <div className="flex items-center gap-2 rounded-2xl rounded-tl-sm border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2.5 text-sm text-emerald-700 dark:text-emerald-400">
                      <CheckCircle2 className="size-4 shrink-0" />
                      <span>{msg.text}</span>
                    </div>
                  ) : (
                    <>
                      {msg.sender === "assistant" && (
                        <div className="mb-1 flex items-center gap-1.5">
                          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary">
                            <Bot className="h-3 w-3 text-primary-foreground" />
                          </div>
                          <span className="text-[11px] font-medium text-muted-foreground">
                            {assistantName}
                          </span>
                        </div>
                      )}
                      <div
                        className={cn(
                          "max-w-[82%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                          msg.sender === "user"
                            ? "rounded-br-sm bg-primary text-primary-foreground"
                            : "ml-6 rounded-bl-sm border border-border bg-card text-card-foreground shadow-sm",
                        )}
                      >
                        {msg.text}
                      </div>
                      <span
                        className={cn(
                          "mt-1 px-0.5 text-[10px] text-muted-foreground",
                          msg.sender === "assistant" && "ml-6",
                        )}
                      >
                        {msg.time}
                      </span>
                    </>
                  )}
                </div>
              ))}

              {/* Thinking indicator */}
              {thinking && (
                <div className="flex flex-col items-start">
                  <div className="mb-1 flex items-center gap-1.5">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary">
                      <Bot className="h-3 w-3 animate-pulse text-primary-foreground" />
                    </div>
                    <span className="text-[11px] font-medium text-muted-foreground">
                      {assistantName}
                    </span>
                  </div>
                  <div className="ml-6 flex flex-col gap-2.5 rounded-2xl rounded-bl-sm border border-border bg-card px-4 py-3 shadow-sm">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        {[0, 1, 2].map((i) => (
                          <span
                            key={i}
                            className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary/50"
                            style={{ animationDelay: `${i * 0.15}s` }}
                          />
                        ))}
                      </div>
                      <span className="text-[11px] text-muted-foreground">
                        Thinking…
                      </span>
                    </div>
                    <div className="h-1 w-28 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-200 ease-out"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div className="shrink-0 border-t border-border bg-card px-3 py-3">
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKey}
              placeholder="Ask me anything…"
              disabled={thinking}
              className="flex-1 rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
            />
            <button
              onClick={send}
              disabled={!input.trim() || thinking}
              aria-label="Send"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Toggle Button ──────────────────────────────────────────────────── */}
      <button
        onClick={toggleOpen}
        aria-label={open ? "Close assistant" : "Open assistant"}
        className={cn(
          "group relative flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all duration-200 hover:scale-105 active:scale-95",
          open
            ? "bg-muted text-foreground hover:bg-muted/70"
            : "bg-primary text-primary-foreground hover:opacity-90",
        )}
      >
        {/* Show down-chevron when minimized, X when open, Bot when closed */}
        {minimized ? (
          <ChevronDown className="h-6 w-6" />
        ) : open ? (
          <X className="h-6 w-6" />
        ) : (
          <Bot className="h-6 w-6 transition-transform duration-200 group-hover:scale-110" />
        )}

        {/* Notification dot — only when widget is fully closed */}
        {!open && !minimized && (
          <span
            className="pointer-events-none absolute right-0 top-0 flex h-3.5 w-3.5"
            aria-hidden
          >
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-70" />
            <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-accent" />
          </span>
        )}
      </button>
    </div>
  );
}
