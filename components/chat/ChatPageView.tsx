/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

"use client";

import { useEffect, useState } from "react";
import { MessageSquareText } from "lucide-react";
import { usePathname } from "next/navigation";
import ChatComposer from "@/components/chat/ChatComposer";
import ChatSourceList from "@/components/chat/ChatSourceList";
import ChatThread from "@/components/chat/ChatThread";
import { getMessage } from "@/lib/i18n";
import { type ChatConversation, type ChatSource } from "@/types/chat";
import { type MessageDictionary } from "@/types/i18n";

type ChatPageViewProps = {
  initialConversation: ChatConversation;
  messages: MessageDictionary;
};

export default function ChatPageView({
  initialConversation,
  messages,
}: ChatPageViewProps) {
  const pathname = usePathname();
  const [conversation, setConversation] =
    useState<ChatConversation>(initialConversation);
  const [isPending, setIsPending] = useState(false);
  const [latestSources, setLatestSources] = useState<ChatSource[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function refreshConversation() {
    const response = await fetch("/api/chat", {
      cache: "no-store",
    });

    const payload = (await response.json()) as {
      conversation?: ChatConversation;
      error?: string;
    };

    if (!response.ok || !payload.conversation) {
      setError(payload.error ?? "Failed to load conversation");
      return;
    }

    setConversation(payload.conversation);
    setLatestSources([]);
    setError(null);
    setIsPending(false);
  }

  useEffect(() => {
    void refreshConversation();
  }, [pathname]);

  useEffect(() => {
    setConversation(initialConversation);
    setLatestSources([]);
    setError(null);
    setIsPending(false);
  }, [initialConversation]);

  useEffect(() => {
    function handleFocus() {
      void refreshConversation();
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        void refreshConversation();
      }
    }

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  async function handleSend(message: string) {
    setError(null);
    setLatestSources([]);

    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message }),
    });

    const payload = (await response.json()) as {
      conversation?: ChatConversation;
      error?: string;
      sources?: ChatSource[];
    };

    if (!response.ok || !payload.conversation) {
      setError(payload.error ?? "Failed to send chat message");
      return;
    }

    setConversation(payload.conversation);
    setLatestSources(payload.sources ?? []);
  }

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-6xl flex-col px-6 py-8 sm:px-8 lg:px-10">
      <section className="rounded-[2rem] border border-border/70 bg-card/70 p-6 shadow-xl shadow-black/5 backdrop-blur lg:p-8">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl border border-border/70 bg-background/70 p-3">
            <MessageSquareText className="size-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {getMessage(messages, "chat.page.title", "Chat")}
            </h1>
            <p className="mt-3 max-w-3xl text-base leading-8 text-muted-foreground sm:text-lg">
              {getMessage(
                messages,
                "chat.page.subtitle",
                "Use your persistent workspace conversation for retrieval-backed answers grounded in documents, personal info, and meetings.",
              )}
            </p>
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
        <div className="space-y-6 rounded-[2rem] border border-border/70 bg-card/70 p-6 shadow-xl shadow-black/5 backdrop-blur lg:p-8">
          <ChatThread
            isPending={isPending}
            messages={messages}
            thread={conversation.messages}
          />
          {error ? (
            <div className="rounded-[1.25rem] border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              {error}
            </div>
          ) : null}
          <ChatComposer
            onPendingChange={setIsPending}
            messages={messages}
            onSubmit={handleSend}
            placeholderKey="chat.composer.placeholder"
            placeholderFallback="Ask about your documents, profile, or meetings..."
          />
        </div>

        <div className="space-y-6">
          <div className="rounded-[2rem] border border-border/70 bg-card/70 p-6 shadow-xl shadow-black/5 backdrop-blur">
            <p className="text-sm font-semibold tracking-[0.22em] uppercase text-muted-foreground">
              {getMessage(
                messages,
                "chat.page.historyTitle",
                "Persistent thread",
              )}
            </p>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              {getMessage(
                messages,
                "chat.page.historyBody",
                "This page keeps your workspace conversation, while the home widget starts fresh for each question.",
              )}
            </p>
          </div>
          <ChatSourceList messages={messages} sources={latestSources} />
        </div>
      </section>
    </div>
  );
}
