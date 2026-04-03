/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

"use client";

import Link from "next/link";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import { useEffect, useSyncExternalStore } from "react";
import { buttonVariants, Button } from "@/components/ui/button";
import deMessages from "@/messages/de.json";
import enMessages from "@/messages/en.json";
import { cn } from "@/lib/utils";
import {
  DEFAULT_LANGUAGE,
  isSupportedLanguage,
  type AppLanguage,
} from "@/types/i18n";

type Messages = typeof deMessages;

const messagesByLanguage: Record<AppLanguage, Messages> = {
  de: deMessages,
  en: enMessages,
};

function getMsg(messages: Messages, key: string, fallback: string): string {
  const parts = key.split(".");
  let node: unknown = messages;
  for (const part of parts) {
    if (node == null || typeof node !== "object") return fallback;
    node = (node as Record<string, unknown>)[part];
  }
  return typeof node === "string" ? node : fallback;
}

const emptySubscribe = () => () => {};

function getLanguageSnapshot(): AppLanguage {
  if (typeof document === "undefined") {
    return DEFAULT_LANGUAGE;
  }

  const htmlLanguage = document.documentElement.lang.toLowerCase();

  return isSupportedLanguage(htmlLanguage) ? htmlLanguage : DEFAULT_LANGUAGE;
}

export default function Error({
  error,
  reset,
}: Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>) {
  const language = useSyncExternalStore(
    emptySubscribe,
    getLanguageSnapshot,
    () => DEFAULT_LANGUAGE,
  );
  const messages = messagesByLanguage[language];

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 items-center px-4 py-10 sm:px-6 lg:px-8">
      <section className="w-full rounded-[2rem] border border-black/10 bg-white/70 p-6 shadow-2xl shadow-black/10 backdrop-blur-xl dark:border-white/10 dark:bg-black/35 sm:p-8 lg:p-10">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-3 py-1 text-xs font-semibold tracking-[0.22em] text-muted-foreground uppercase backdrop-blur-sm">
            <AlertTriangle className="size-3.5 text-destructive" />
            {getMessage(messages, "error.global.badge", "Application recovery")}
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold tracking-[0.28em] text-muted-foreground uppercase">
              {getMessage(messages, "auth.brandName", "See-Sweet")}
            </p>
            <h1 className="max-w-2xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              {getMessage(
                messages,
                "error.global.title",
                "Something went wrong.",
              )}
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              {getMessage(
                messages,
                "error.global.body",
                "The workspace hit an unexpected problem. Try again, or return to a stable page.",
              )}
            </p>
            {error.digest ? (
              <p className="text-sm text-muted-foreground">
                {getMessage(messages, "error.global.reference", "Reference")}
                {": "}
                <span className="font-mono text-foreground">
                  {error.digest}
                </span>
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button
              type="button"
              onClick={() => reset()}
              className="h-11 cursor-pointer rounded-xl px-4"
            >
              <RefreshCw className="size-4" />
              {getMessage(messages, "error.global.retry", "Try again")}
            </Button>

            <Link
              href="/home"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "h-11 cursor-pointer rounded-xl px-4",
              )}
            >
              <Home className="size-4" />
              {getMessage(messages, "error.global.goHome", "Open workspace")}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
