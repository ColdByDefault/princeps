/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

"use client";

import Link from "next/link";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import { useEffect, useSyncExternalStore } from "react";
import { ThemeProvider } from "@/components/theme";
import { Toaster } from "@/components/ui/sonner";
import { buttonVariants, Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DEFAULT_LANGUAGE,
  isSupportedLanguage,
  type AppLanguage,
} from "@/types/i18n";
import "./globals.css";

const t: Record<AppLanguage, Record<string, string>> = {
  de: {
    badge: "Fehlerbehebung",
    title: "Etwas ist schiefgelaufen.",
    body: "Der Arbeitsbereich hat ein unerwartetes Problem festgestellt. Bitte versuche es erneut oder kehre zu einer stabilen Seite zurück.",
    reference: "Referenz",
    retry: "Erneut versuchen",
    goHome: "Zum Arbeitsbereich",
    goLogin: "Zur Anmeldung",
    brand: "Princeps",
  },
  en: {
    badge: "Application recovery",
    title: "Something went wrong.",
    body: "The workspace hit an unexpected problem. Try again, or return to a stable page.",
    reference: "Reference",
    retry: "Try again",
    goHome: "Open workspace",
    goLogin: "Open sign in",
    brand: "Princeps",
  },
};

const emptySubscribe = () => () => {};

function getLanguageSnapshot(): AppLanguage {
  if (typeof document === "undefined") {
    return DEFAULT_LANGUAGE;
  }

  const htmlLanguage = document.documentElement.lang.toLowerCase();

  return isSupportedLanguage(htmlLanguage) ? htmlLanguage : DEFAULT_LANGUAGE;
}

export default function GlobalError({
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
  const m = t[language];

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang={language} suppressHydrationWarning>
      <body className="bg-background antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <div className="bg-background relative flex min-h-svh flex-col overflow-hidden">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-15 dark:opacity-25"
              style={{
                backgroundImage:
                  "radial-gradient(circle at top left, #7c3aed 0%, transparent 38%), radial-gradient(circle at bottom right, #a855f7 0%, transparent 32%)",
              }}
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-30"
              style={{
                backgroundImage:
                  "linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)",
                backgroundSize: "5rem 5rem",
              }}
            />
            <div
              aria-hidden
              className="from-background pointer-events-none absolute inset-x-0 top-0 h-40 bg-linear-to-b to-transparent"
            />

            <main className="relative mx-auto flex min-h-svh w-full max-w-5xl flex-1 items-center px-4 py-10 sm:px-6 lg:px-8">
              <section className="w-full rounded-[2rem] border border-black/10 bg-white/70 p-6 shadow-2xl shadow-black/10 backdrop-blur-xl dark:border-white/10 dark:bg-black/35 sm:p-8 lg:p-10">
                <div className="space-y-6">
                  <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-3 py-1 text-xs font-semibold tracking-[0.22em] text-muted-foreground uppercase backdrop-blur-sm">
                    <AlertTriangle className="size-3.5 text-destructive" />
                    {m.badge}
                  </div>

                  <div className="space-y-3">
                    <p className="text-xs font-semibold tracking-[0.28em] text-muted-foreground uppercase">
                      {m.brand}
                    </p>
                    <h1 className="max-w-2xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
                      {m.title}
                    </h1>
                    <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                      {m.body}
                    </p>
                    {error.digest ? (
                      <p className="text-sm text-muted-foreground">
                        {m.reference}
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
                      {m.retry}
                    </Button>

                    <Link
                      href="/home"
                      className={cn(
                        buttonVariants({ variant: "outline", size: "lg" }),
                        "h-11 cursor-pointer rounded-xl px-4",
                      )}
                    >
                      <Home className="size-4" />
                      {m.goHome}
                    </Link>
                  </div>
                </div>
              </section>
            </main>
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
