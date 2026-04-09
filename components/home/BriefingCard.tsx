/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Newspaper, RefreshCw } from "lucide-react";
import type { BriefingRecord } from "@/types/api";

const PREVIEW_LENGTH = 220;

function extractPreview(markdown: string): string {
  return markdown
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/\[(.+?)\]\(.+?\)/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .replace(/\n+/g, " ")
    .trim()
    .slice(0, PREVIEW_LENGTH);
}

type BriefingCardProps = {
  initialBriefing: BriefingRecord | null;
  autoBriefingEnabled: boolean;
};

export function BriefingCard({
  initialBriefing,
  autoBriefingEnabled,
}: BriefingCardProps) {
  const t = useTranslations("home.briefing");
  const [briefing, setBriefing] = useState<BriefingRecord | null>(
    initialBriefing,
  );
  const [refreshing, setRefreshing] = useState(false);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      const res = await fetch("/api/briefings", { method: "POST" });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { briefing: BriefingRecord };
      setBriefing(data.briefing);
      toast.success(t("generateSuccess"));
    } catch {
      toast.error(t("generateError"));
    } finally {
      setRefreshing(false);
    }
  }

  const preview = briefing ? extractPreview(briefing.content) : null;
  const isLong = briefing
    ? briefing.content.replace(/\s+/g, " ").length > PREVIEW_LENGTH
    : false;

  return (
    <div className="w-full max-w-sm rounded-xl border border-border/60 bg-card px-4 py-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5">
          <Newspaper
            className="h-4 w-4 text-muted-foreground shrink-0"
            aria-hidden="true"
          />
          <p className="text-sm font-semibold">{t("title")}</p>
        </div>
        {autoBriefingEnabled && (
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="cursor-pointer rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={t("refresh")}
            title={refreshing ? t("refreshing") : t("refresh")}
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`}
              aria-hidden="true"
            />
          </button>
        )}
      </div>

      {/* Content */}
      {!autoBriefingEnabled ? (
        <div className="space-y-1.5">
          <p className="text-sm text-muted-foreground">{t("autoOff")}</p>
          <p className="text-xs text-muted-foreground/60">{t("autoOffHint")}</p>
          <Link
            href="/settings"
            className="inline-block mt-1 text-xs text-foreground underline-offset-2 hover:underline font-medium"
          >
            {t("goToSettings")}
          </Link>
        </div>
      ) : preview ? (
        <div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {preview}
            {isLong && (
              <>
                {"… "}
                <Link
                  href="/briefings"
                  className="text-foreground underline-offset-2 hover:underline font-medium"
                >
                  {t("readMore")}
                </Link>
              </>
            )}
          </p>
          {briefing && (
            <p className="mt-2 text-xs text-muted-foreground/50">
              {t("generatedAt")}:{" "}
              {new Date(briefing.generatedAt).toLocaleString()}
            </p>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      )}
    </div>
  );
}

 