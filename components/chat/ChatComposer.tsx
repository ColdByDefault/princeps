/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

"use client";

import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { getMessage } from "@/lib/i18n";
import { type MessageDictionary } from "@/types/i18n";

type ChatComposerProps = {
  disabled?: boolean;
  messages: MessageDictionary;
  onSubmit: (message: string) => Promise<void>;
  placeholderKey: string;
  placeholderFallback: string;
};

export default function ChatComposer({
  disabled,
  messages,
  onSubmit,
  placeholderKey,
  placeholderFallback,
}: ChatComposerProps) {
  const [value, setValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    const nextValue = value.trim();

    if (!nextValue || isSubmitting || disabled) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit(nextValue);
      setValue("");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-3">
      <Textarea
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={getMessage(messages, placeholderKey, placeholderFallback)}
        className="min-h-24 rounded-[1.5rem] border-border/70 bg-background/70 px-4 py-3"
      />
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          {getMessage(
            messages,
            "chat.composer.helper",
            "Keep prompts specific for better retrieval results.",
          )}
        </p>
        <Button
          type="button"
          className="cursor-pointer rounded-xl px-4"
          disabled={disabled || isSubmitting || value.trim().length === 0}
          onClick={handleSubmit}
        >
          {isSubmitting
            ? getMessage(messages, "chat.composer.sending", "Sending...")
            : getMessage(messages, "chat.composer.send", "Send")}
          <ArrowUpRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
