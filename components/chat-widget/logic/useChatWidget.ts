/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version canary-v1.1.4
 * @since canary-v1.1.4
 */

"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useVoiceInput } from "./useVoiceInput";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Message {
  id: number;
  text: string;
  sender: "user" | "assistant" | "action" | "agent";
  time: string;
  /** Populated only when sender === "action" or "agent" */
  actionLabel?: string;
}

type HistoryEntry = { role: "user" | "assistant"; content: string };

type SseEvent =
  | { type: "token"; text: string }
  | { type: "done" }
  | { type: "error"; message: string }
  | { type: "action"; name: string; record: Record<string, unknown> }
  | { type: "agent"; name: string; ok: boolean };

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getTime() {
  return new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useChatWidget({
  userId,
  assistantName,
}: {
  userId: string;
  assistantName: string;
}) {
  const t = useTranslations("chatWidget");
  const STORAGE_KEY = `Princeps:widget:${userId}`;

  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [progress, setProgress] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  // Live tool/agent activity shown inside the thinking indicator.
  // Updated as each tool fires; cleared (and summarised) once the stream ends.
  const [widgetActivity, setWidgetActivity] = useState<{
    labels: string[];
    latest: string;
  } | null>(null);
  const widgetActivityRef = useRef<{ labels: string[]; latest: string } | null>(
    null,
  );

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // Keep a ref of the current message list for use inside async callbacks
  const messagesRef = useRef<Message[]>([]);
  messagesRef.current = messages;
  // Stable ref so the load effect can read assistantName without re-running
  const assistantNameRef = useRef(assistantName);
  assistantNameRef.current = assistantName;

  const voiceErrorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTranscribed = useCallback((text: string) => {
    setInput((prev) => (prev ? `${prev} ${text}` : text));
    requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  const handleVoiceError = useCallback(
    (key: string) => {
      const msg =
        key === "micPermissionDenied"
          ? t("micPermissionDenied")
          : t("transcribeError");
      setVoiceError(msg);
      if (voiceErrorTimerRef.current) clearTimeout(voiceErrorTimerRef.current);
      voiceErrorTimerRef.current = setTimeout(() => setVoiceError(null), 5_000);
    },
    [t],
  );

  // Defined before useVoiceInput so it can be passed as onAutoSend
  // (actual send logic is below — this ref avoids a circular dependency)
  const sendRef = useRef<((textOverride?: string) => Promise<void>) | null>(
    null,
  );
  const handleAutoSend = useCallback((text: string) => {
    sendRef.current?.(text);
  }, []);

  const { voiceState, startRecording, stopRecording } = useVoiceInput({
    onTranscribed: handleTranscribed,
    onAutoSend: handleAutoSend,
    onError: handleVoiceError,
  });

  // Load session from sessionStorage once on mount. Uses a ref so the name
  // does not cause this effect to re-run (greeting sync is handled below).
  useEffect(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Message[];
        if (parsed.length > 0) {
          setMessages(parsed);
          setSessionLoaded(true);
          return;
        }
      } catch {
        // fall through to fresh greeting
      }
    }
    setMessages([
      {
        id: 1,
        text: `Hi! I'm ${assistantNameRef.current}, your personal assistant. How can I help you today?`,
        sender: "assistant",
        time: getTime(),
      },
    ]);
    setSessionLoaded(true);
  }, [STORAGE_KEY]);

  // Keep greeting in sync whenever the name prop changes (e.g. after the
  // provider fetches the freshest name from the server).
  useEffect(() => {
    if (!sessionLoaded) return;
    setMessages((prev) =>
      prev.map((m) =>
        m.id === 1 && m.sender === "assistant"
          ? {
              ...m,
              text: `Hi! I'm ${assistantName}, your personal assistant. How can I help you today?`,
            }
          : m,
      ),
    );
  }, [assistantName, sessionLoaded]);

  // Persist messages to sessionStorage whenever they change
  useEffect(() => {
    if (!sessionLoaded) return;
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }, [messages, sessionLoaded, STORAGE_KEY]);

  // Scroll to latest message
  useEffect(() => {
    if (sessionLoaded)
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking, sessionLoaded]);

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

  // Clear session and restart with a fresh greeting
  const startNewChat = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY);
    setMessages([
      {
        id: 1,
        text: `Hi! I'm ${assistantName}, your personal assistant. How can I help you today?`,
        sender: "assistant",
        time: getTime(),
      },
    ]);
  }, [STORAGE_KEY, assistantName]);

  const send = useCallback(
    async (textOverride?: string) => {
      const text = (textOverride ?? input).trim();
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
        .filter(
          (m) => m.id !== 1 && m.sender !== "action" && m.sender !== "agent",
        )
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
          body: JSON.stringify({
            message: text,
            history: history.slice(0, -1),
          }),
        });

        if (!res.ok) {
          let errMsg = "Something went wrong. Please try again.";
          try {
            const errBody = (await res.json()) as { error?: string };
            if (errBody.error) errMsg = errBody.error;
          } catch {
            // ignore — body not parseable
          }
          throw new Error(errMsg);
        }
        if (!res.body) {
          throw new Error("Something went wrong. Please try again.");
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
                create_task: "Task created",
                list_tasks: "Tasks retrieved",
                complete_task: "Task completed",
                update_task: "Task updated",
                delete_task: "Task deleted",
                create_label: "Label created",
                list_labels: "Labels retrieved",
                update_label: "Label updated",
                delete_label: "Label deleted",
              };
              const label = actionNameMap[event.name] ?? event.name;
              const next = {
                labels: [...(widgetActivityRef.current?.labels ?? []), label],
                latest: label,
              };
              widgetActivityRef.current = next;
              setWidgetActivity(next);
            } else if (event.type === "agent") {
              const agentLabelMap: Record<string, string> = {
                "task-extractor": "Task Extractor",
                "decision-logger": "Decision Logger",
                "commitment-tracker": "Commitment Tracker",
                "weekly-review": "Weekly Review",
                "signal-feed": "Signal Feed",
              };
              const label = agentLabelMap[event.name] ?? event.name;
              const next = {
                labels: [...(widgetActivityRef.current?.labels ?? []), label],
                latest: label,
              };
              widgetActivityRef.current = next;
              setWidgetActivity(next);
            } else if (event.type === "done") {
              break;
            } else if (event.type === "error") {
              throw new Error(event.message);
            }
          }
        }
      } catch (err) {
        const errorText =
          err instanceof Error
            ? err.message
            : "Something went wrong. Please try again.";
        if (firstToken) {
          setMessages((prev) => [
            ...prev,
            {
              id: assistantId,
              text: errorText,
              sender: "assistant",
              time: getTime(),
            },
          ]);
        } else {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, text: errorText } : m,
            ),
          );
        }
      } finally {
        // If any tools / agents ran, insert a single compact summary line
        // immediately before the assistant's response message.
        const activity = widgetActivityRef.current;
        if (activity && activity.labels.length > 0) {
          const unique = [...new Set(activity.labels)];
          const summaryText =
            unique.length <= 2
              ? unique.join(" · ")
              : `${unique[0]} · +${unique.length - 1} more`;
          setMessages((prev) => {
            const idx = prev.findIndex((m) => m.id === assistantId);
            const summaryMsg: Message = {
              id: Date.now(),
              text: summaryText,
              sender: "action",
              time: getTime(),
            };
            if (idx < 0) return [...prev, summaryMsg];
            return [...prev.slice(0, idx), summaryMsg, ...prev.slice(idx)];
          });
        }
        widgetActivityRef.current = null;
        setWidgetActivity(null);
        setThinking(false);
        requestAnimationFrame(() => inputRef.current?.focus());
        window.dispatchEvent(new CustomEvent("notifications:refresh"));
      }
    },
    [input, thinking],
  );

  // Keep sendRef in sync so handleAutoSend always calls the latest send closure
  sendRef.current = send;

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  };

  const toggleOpen = () => {
    if (minimized) {
      setMinimized(false);
      return;
    }
    setOpen((v) => !v);
  };

  return {
    // state
    open,
    setOpen,
    minimized,
    setMinimized,
    thinking,
    progress,
    messages,
    input,
    setInput,
    sessionLoaded,
    voiceError,
    widgetActivity,
    // computed
    isVisible: open && !minimized,
    // refs
    bottomRef,
    inputRef,
    // handlers
    send,
    startNewChat,
    toggleOpen,
    onKey,
    // voice
    voiceState,
    startRecording,
    stopRecording,
  };
}
