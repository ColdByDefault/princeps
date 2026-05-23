/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version canary-v1.1.4
 * @since beta
 */

"use client";

import {
  X,
  Send,
  Minus,
  Bot,
  ChevronDown,
  CheckCircle2,
  Plus,
  Mic,
  MicOff,
  Loader2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/core/utils";
import { useChatWidget } from "./logic/useChatWidget";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChatWidgetProps {
  assistantName?: string | undefined;
  userId: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ChatWidget({
  assistantName = "Atlas",
  userId,
}: ChatWidgetProps) {
  const t = useTranslations("chatWidget");

  const {
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
    isVisible,
    bottomRef,
    inputRef,
    send,
    startNewChat,
    toggleOpen,
    onKey,
    voiceState,
    startRecording,
    stopRecording,
  } = useChatWidget({ userId, assistantName });

  return (
    <div className="fixed bottom-12 left-6 z-50 flex flex-col items-start">
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
              <p className="mt-0.5 flex items-center gap-1 text-[11px] text-primary-foreground/65">
                <span
                  className="inline-block h-1.5 w-1.5 rounded-full bg-green-400"
                  aria-hidden
                />
                Personal assistant
              </p>
            </div>
          </div>

          <div className="flex items-center gap-0.5">
            <button
              onClick={startNewChat}
              disabled={thinking}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-primary-foreground/70 transition-colors hover:bg-white/10 hover:text-primary-foreground disabled:opacity-40 cursor-pointer"
              aria-label={t("newChat")}
              title={t("newChat")}
            >
              <Plus className="h-4 w-4" />
            </button>
            <button
              onClick={() => setMinimized(true)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-primary-foreground/70 transition-colors hover:bg-white/10 hover:text-primary-foreground cursor-pointer"
              aria-label="Minimize"
            >
              <Minus className="h-4 w-4" />
            </button>
            <button
              onClick={() => setOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-primary-foreground/70 transition-colors hover:bg-white/10 hover:text-primary-foreground cursor-pointer"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto bg-muted/20 px-4 py-4">
          {!sessionLoaded ? (
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
                    <div className="flex items-center gap-1.5 py-0.5 text-[11px]">
                      <CheckCircle2 className="size-3 shrink-0 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-emerald-700 dark:text-emerald-400">
                        {msg.text}
                      </span>
                    </div>
                  ) : msg.sender === "agent" ? (
                    <div className="flex items-center gap-2 rounded-2xl rounded-tl-sm border border-violet-500/30 bg-violet-500/10 px-3.5 py-2.5 text-sm text-violet-700 dark:text-violet-400">
                      <Bot className="size-4 shrink-0" />
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
                        {msg.sender === "assistant" ? (
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
                              {msg.text}
                            </ReactMarkdown>
                          </div>
                        ) : (
                          msg.text
                        )}
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
                      {widgetActivity ? (
                        <>
                          <span className="size-1.5 shrink-0 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="max-w-35 truncate text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                            {widgetActivity.latest}
                          </span>
                          {widgetActivity.labels.length > 1 && (
                            <span className="shrink-0 text-[11px] text-muted-foreground">
                              · +{widgetActivity.labels.length - 1} more
                            </span>
                          )}
                        </>
                      ) : (
                        <>
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
                        </>
                      )}
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
              placeholder={t("placeholder")}
              disabled={thinking || voiceState === "transcribing"}
              className={cn(
                "flex-1 rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50",
                voiceState === "recording" &&
                  "border-red-500 ring-1 ring-red-500",
              )}
            />
            {/* Mic button */}
            <button
              type="button"
              onClick={
                voiceState === "recording" ? stopRecording : startRecording
              }
              disabled={thinking || voiceState === "transcribing"}
              aria-label={
                voiceState === "recording"
                  ? t("stopRecording")
                  : t("startRecording")
              }
              title={
                voiceState === "recording"
                  ? t("stopRecording")
                  : voiceState === "transcribing"
                    ? t("transcribing")
                    : t("startRecording")
              }
              className={cn(
                "flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl transition-all disabled:opacity-40",
                voiceState === "recording"
                  ? "animate-pulse bg-red-500 text-white hover:bg-red-600"
                  : "bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground",
              )}
            >
              {voiceState === "transcribing" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : voiceState === "recording" ? (
                <MicOff className="h-4 w-4" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </button>
            <button
              onClick={() => send()}
              disabled={!input.trim() || thinking || voiceState !== "idle"}
              aria-label={t("send")}
              className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-primary text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          {voiceError && (
            <p className="mt-1.5 px-1 text-[11px] text-red-500">{voiceError}</p>
          )}
        </div>
      </div>

      {/* ── Toggle Button ──────────────────────────────────────────────────── */}
      <button
        onClick={toggleOpen}
        aria-label={open ? "Close assistant" : "Open assistant"}
        className={cn(
          "group relative flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all duration-200 hover:scale-105 active:scale-95  cursor-pointer",
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

        {/* Online status dot — only when widget is fully closed */}
        {!open && !minimized && (
          <span
            className="pointer-events-none absolute right-0 top-0 flex h-3.5 w-3.5"
            aria-hidden
          >
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-60" />
            <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-green-600" />
          </span>
        )}
      </button>
    </div>
  );
}
