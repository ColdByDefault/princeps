/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import ChatComposer from "@/components/chat/ChatComposer";
import ChatSourceList from "@/components/chat/ChatSourceList";
import { getMessage } from "@/lib/i18n";
import { type ChatSource } from "@/types/chat";
import { type MessageDictionary } from "@/types/i18n";

type HomeChatWidgetProps = {
  messages: MessageDictionary;
};

export default function HomeChatWidget({ messages }: HomeChatWidgetProps) {
  const [reply, setReply] = useState<string | null>(null);
  const [sources, setSources] = useState<ChatSource[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function handleSend(message: string) {
    setError(null);

    const response = await fetch("/api/chat/widget", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message }),
    });

    const payload = (await response.json()) as {
      error?: string;
      reply?: string;
      sources?: ChatSource[];
    };

    if (!response.ok || !payload.reply) {
      setError(payload.error ?? "Failed to send widget chat message");
      return;
    }

    setReply(payload.reply);
    setSources(payload.sources ?? []);
  }

  return (
    <section className="mt-8 rounded-[2rem] border border-border/70 bg-card/70 p-6 shadow-xl shadow-black/5 backdrop-blur lg:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold tracking-[0.22em] uppercase text-muted-foreground">
            {getMessage(messages, "home.chat.badge", "Quick assistant")}
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">
            {getMessage(messages, "home.chat.title", "Ask one quick question")}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">
            {getMessage(
              messages,
              "home.chat.description",
              "This widget is stateless for now. Use the full chat page for your persistent conversation.",
            )}
          </p>
        </div>
        <Button
          variant="outline"
          className="cursor-pointer rounded-xl px-4"
          nativeButton={false}
          render={<Link href="/chat" />}
        >
          {getMessage(messages, "home.chat.openFull", "Open full chat")}
        </Button>
      </div>

      <div className="mt-6 space-y-6">
        <ChatComposer
          messages={messages}
          onSubmit={handleSend}
          placeholderKey="home.chat.placeholder"
          placeholderFallback="Ask about a document, your profile, or a meeting..."
        />

        {error ? (
          <div className="rounded-[1.25rem] border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        {reply ? (
          <div className="rounded-[1.5rem] border border-border/70 bg-background/70 p-5">
            <p className="text-xs font-semibold tracking-[0.18em] uppercase text-muted-foreground">
              {getMessage(messages, "chat.thread.assistant", "Assistant")}
            </p>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-7">
              {reply}
            </p>
          </div>
        ) : null}

        <ChatSourceList messages={messages} sources={sources} />
      </div>
    </section>
  );
}
