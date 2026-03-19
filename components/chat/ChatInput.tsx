/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

"use client";

import { useSyncExternalStore, useState, useRef } from "react";
import { ArrowUp, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { type MessageDictionary } from "@/types/i18n";

const THINKING_STORAGE_KEY = "see-sweet:chat:think";

function getThinkSnapshot() {
  try {
    return localStorage.getItem(THINKING_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

type Props = {
  messages: MessageDictionary;
  disabled: boolean;
  onSend: (text: string, think: boolean) => void;
};

export default function ChatInput({
  messages: _messages,
  disabled,
  onSend,
}: Props) {
  const [value, setValue] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);

  // SSR-safe read from localStorage — no useEffect/setState needed.
  const storedThink = useSyncExternalStore(
    () => () => {}, // no subscription
    getThinkSnapshot, // client
    () => false, // server
  );

  // Local override so a toggle click is reflected instantly without waiting for a re-render cycle.
  const [thinkOverride, setThinkOverride] = useState<boolean | null>(null);
  const think = thinkOverride !== null ? thinkOverride : storedThink;

  const toggleThink = () => {
    const next = !think;
    setThinkOverride(next);

    try {
      localStorage.setItem(THINKING_STORAGE_KEY, String(next));
    } catch {
      // ignore
    }
  };

  const handleSend = () => {
    const text = value.trim();

    if (!text || disabled) return;

    onSend(text, think);
    setValue("");

    if (ref.current) {
      ref.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);

    const el = ref.current;

    if (el) {
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
    }
  };

  return (
    <div className="border-t border-border/60 bg-background/80 px-4 py-4 backdrop-blur-sm">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-end gap-2 rounded-2xl border border-border/70 bg-card/80 px-3 py-2 shadow-sm">
          <textarea
            ref={ref}
            value={value}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder="Message your assistant…"
            rows={1}
            className={cn(
              "flex-1 resize-none bg-transparent py-1 text-sm leading-6 outline-none placeholder:text-muted-foreground/60",
              "max-h-50 overflow-y-auto",
              disabled && "cursor-not-allowed opacity-50",
            )}
          />

          <div className="flex shrink-0 items-center gap-1.5 pb-0.5">
            <Tooltip>
              <TooltipTrigger>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Toggle thinking mode"
                  aria-pressed={think}
                  onClick={toggleThink}
                  className={cn(
                    "cursor-pointer rounded-xl",
                    think
                      ? "bg-primary/15 text-primary hover:bg-primary/25"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Brain className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                {think ? "Thinking on" : "Thinking off"}
              </TooltipContent>
            </Tooltip>

            <Button
              type="button"
              size="icon-sm"
              aria-label="Send message"
              disabled={disabled || !value.trim()}
              onClick={handleSend}
              className="cursor-pointer rounded-xl"
            >
              <ArrowUp className="size-4" />
            </Button>
          </div>
        </div>

        <p className="mt-2 text-center text-[11px] text-muted-foreground/50">
          Press Enter to send · Shift+Enter for new line
          {think ? " · Thinking mode on" : ""}
        </p>
      </div>
    </div>
  );
}
