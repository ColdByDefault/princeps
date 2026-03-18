/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { getMessage } from "@/lib/i18n";
import { type ChatSource } from "@/types/chat";
import { type MessageDictionary } from "@/types/i18n";

type ChatSourceListProps = {
  messages: MessageDictionary;
  sources: ChatSource[];
};

export default function ChatSourceList({
  messages,
  sources,
}: ChatSourceListProps) {
  if (sources.length === 0) {
    return null;
  }

  return (
    <section className="rounded-[1.5rem] border border-border/70 bg-background/70 p-5">
      <p className="text-sm font-semibold tracking-[0.22em] uppercase text-muted-foreground">
        {getMessage(messages, "chat.sources.title", "Sources")}
      </p>
      <div className="mt-4 grid gap-3">
        {sources.map((source, index) => (
          <article
            key={`${source.kind}-${source.label}-${index}`}
            className="rounded-[1.25rem] border border-border/70 bg-card/80 p-4"
          >
            <p className="text-xs font-semibold tracking-[0.18em] uppercase text-muted-foreground">
              {source.kind}
            </p>
            <h3 className="mt-2 text-sm font-medium">{source.label}</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {source.snippet}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
