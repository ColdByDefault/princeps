/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { getMessage } from "@/lib/i18n";
import { type ChatMessage } from "@/types/chat";
import { type MessageDictionary } from "@/types/i18n";

type ChatThreadProps = {
  isPending?: boolean;
  messages: MessageDictionary;
  thread: ChatMessage[];
};

export default function ChatThread({
  isPending = false,
  messages,
  thread,
}: ChatThreadProps) {
  if (thread.length === 0) {
    return (
      <div className="space-y-3">
        <div className="rounded-[1.5rem] border border-dashed border-border/70 bg-background/60 p-6 text-sm text-muted-foreground">
          {getMessage(
            messages,
            "chat.thread.empty",
            "No conversation yet. Ask a question to start your workspace thread.",
          )}
        </div>
        {isPending ? (
          <article className="flex justify-start">
            <div className="max-w-[85%] rounded-[1.5rem] border border-border/70 bg-background/70 px-4 py-3 text-sm leading-7">
              <p className="mb-1 text-[11px] font-semibold tracking-[0.18em] uppercase opacity-70">
                {getMessage(messages, "chat.thread.assistant", "Assistant")}
              </p>
              <p className="text-muted-foreground">
                {getMessage(
                  messages,
                  "chat.thread.pending",
                  "Assistant is preparing your answer...",
                )}
              </p>
            </div>
          </article>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {thread.map((message) => {
        const isUser = message.role === "user";
        const isPendingAssistantMessage =
          !isUser &&
          isPending &&
          message.id === thread[thread.length - 1]?.id &&
          message.content.trim().length === 0;

        return (
          <article
            key={message.id}
            className={isUser ? "flex justify-end" : "flex justify-start"}
          >
            <div
              className={
                isUser
                  ? "max-w-[85%] rounded-[1.5rem] bg-primary px-4 py-3 text-sm leading-7 text-primary-foreground"
                  : "max-w-[85%] rounded-[1.5rem] border border-border/70 bg-background/70 px-4 py-3 text-sm leading-7"
              }
            >
              <p className="mb-1 text-[11px] font-semibold tracking-[0.18em] uppercase opacity-70">
                {isUser
                  ? getMessage(messages, "chat.thread.user", "You")
                  : getMessage(messages, "chat.thread.assistant", "Assistant")}
              </p>
              <p className="whitespace-pre-wrap">
                {isPendingAssistantMessage
                  ? getMessage(
                      messages,
                      "chat.thread.pending",
                      "Assistant is preparing your answer...",
                    )
                  : message.content}
              </p>
            </div>
          </article>
        );
      })}
    </div>
  );
}
