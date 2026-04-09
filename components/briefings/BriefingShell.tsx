"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { RefreshCw, Sparkles, Info } from "lucide-react";
import { useTranslations } from "next-intl";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { useBriefingMutations } from "./logic/useBriefingMutations";
import type { BriefingRecord } from "@/types/api";

type BriefingShellProps = {
  initialBriefing: BriefingRecord | null;
  autoBriefingEnabled: boolean;
};

export function BriefingShell({
  initialBriefing,
  autoBriefingEnabled,
}: BriefingShellProps) {
  const t = useTranslations("briefings");
  const [briefing, setBriefing] = useState<BriefingRecord | null>(
    initialBriefing,
  );
  const [isPendingRefresh, startRefresh] = useTransition();

  const { regenerateBriefing, generating } = useBriefingMutations(setBriefing, {
    generateSuccess: t("generateSuccess"),
    generateError: t("generateError"),
  });

  function handleRefresh() {
    startRefresh(async () => {
      const res = await fetch("/api/briefings");
      if (res.ok) {
        const { briefing: updated } = (await res.json()) as {
          briefing: BriefingRecord | null;
        };
        setBriefing(updated);
      }
    });
  }

  const formattedDate = briefing
    ? new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(briefing.generatedAt))
    : null;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      {/* Auto-off info banner */}
      {!autoBriefingEnabled && (
        <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-border/60 bg-muted/40 px-4 py-3">
          <Info
            className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
          <div className="min-w-0">
            <p className="text-sm font-medium">{t("autoOff")}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {t("autoOffHint")}{" "}
              <Link
                href="/settings"
                className="text-foreground underline-offset-2 hover:underline font-medium"
              >
                {t("goToSettings")}
              </Link>
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("pageTitle")}
          </h1>
          {formattedDate && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {t("generatedAt", { date: formattedDate })}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isPendingRefresh || generating}
            onClick={handleRefresh}
            aria-label={t("refresh")}
            className="cursor-pointer"
          >
            <RefreshCw
              className={`size-3.5 ${isPendingRefresh ? "animate-spin" : ""}`}
            />
            {isPendingRefresh ? t("refreshing") : t("refresh")}
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={generating || isPendingRefresh}
            onClick={() => void regenerateBriefing()}
            aria-label={t("generate")}
            className="cursor-pointer"
          >
            <Sparkles
              className={`size-4 ${generating ? "animate-pulse" : ""}`}
            />
            {generating ? t("generating") : t("generate")}
          </Button>
        </div>
      </div>

      {/* Content */}
      {briefing ? (
        <div className="rounded-xl border border-border/60 bg-card p-6">
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {briefing.content}
            </ReactMarkdown>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 px-6 py-16 text-center">
          <p className="text-sm text-muted-foreground">{t("empty")}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={generating}
            onClick={() => void regenerateBriefing()}
            aria-label={t("generate")}
            className="mt-4 cursor-pointer"
          >
            <Sparkles className="size-4" />
            {t("generate")}
          </Button>
        </div>
      )}
    </div>
  );
}
