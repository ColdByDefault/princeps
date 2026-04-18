/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version beta
 * @since beta
 * @module
 * @description
 */

"use client";

import { useState, useTransition } from "react";
import { RefreshCw, ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import type { ActiveProvider, ProviderStatusPayload } from "@/types/llm";

// ─── Helpers ──────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

// ─── Component ────────────────────────────────────────────

type ProviderTabProps = {
  initialStatus: ProviderStatusPayload;
};

export function ProviderTab({ initialStatus }: ProviderTabProps) {
  const t = useTranslations("settings.provider");
  const [status, setStatus] = useState<ProviderStatusPayload>(initialStatus);
  const [isPending, startTransition] = useTransition();

  const handleRefresh = () => {
    startTransition(async () => {
      const res = await fetch("/api/settings/provider-status");
      if (res.ok) {
        const updated = (await res.json()) as ProviderStatusPayload;
        setStatus(updated);
      }
    });
  };

  const providerLabel = (p: ActiveProvider) =>
    p === "openAi"
      ? t("nameOpenAi")
      : p === "ollama"
        ? t("nameOllama")
        : t("nameGroq");

  return (
    <div className="space-y-2">
      {/* ── AI Provider section ───────────────────── */}
      <Collapsible defaultOpen>
        <div className="flex items-center justify-between gap-4 py-2">
          <CollapsibleTrigger className="group flex flex-1 cursor-pointer items-center justify-between gap-2 text-left">
            <div className="space-y-0.5">
              <p className="text-sm font-medium">{t("title")}</p>
              <p className="text-sm text-muted-foreground">
                {t("description")}
              </p>
            </div>
            <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-panel-open:rotate-180" />
          </CollapsibleTrigger>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="cursor-pointer shrink-0 rounded-full border-border/70"
            disabled={isPending}
            onClick={handleRefresh}
          >
            <RefreshCw
              className={`size-3.5 ${isPending ? "animate-spin" : ""}`}
            />
            {isPending ? t("refreshing") : t("refresh")}
          </Button>
        </div>

        <CollapsibleContent className="space-y-1 pb-2">
          {status.providers.map(({ provider, health }) => (
            <Collapsible key={provider}>
              <CollapsibleTrigger className="group flex w-full cursor-pointer items-center justify-between gap-4 rounded-lg px-3 py-2.5 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">
                    {providerLabel(provider)}
                  </p>
                  {provider === status.active && (
                    <Badge
                      variant="outline"
                      className="text-xs bg-green-600/10 text-green-700 border-green-500/20"
                    >
                      {t("activeLabel")}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    className={
                      health.connected
                        ? "text-xs border-green-500/20 bg-green-500/10 text-green-700 dark:text-green-400"
                        : "text-xs border-destructive/20 bg-destructive/10 text-destructive"
                    }
                  >
                    {health.connected
                      ? t("statusConnected")
                      : t("statusDisconnected")}
                  </Badge>
                  <ChevronDown className="size-3.5 shrink-0 text-muted-foreground transition-transform duration-200 group-data-panel-open:rotate-180" />
                </div>
              </CollapsibleTrigger>

              <CollapsibleContent className="px-3 pb-3 space-y-3">
                {health.version && (
                  <p className="text-xs text-muted-foreground font-mono pt-1">
                    v{health.version}
                  </p>
                )}
                {health.error && (
                  <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {health.error}
                  </p>
                )}
                {health.models.length > 0 && (
                  <div>
                    <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {t("modelsLabel")} ({health.models.length})
                    </p>
                    <div className="divide-y divide-border/60 rounded-lg border border-border/60">
                      {health.models.map((model) => (
                        <div
                          key={model.name}
                          className="flex items-center justify-between px-3 py-2"
                        >
                          <span className="text-sm font-mono">
                            {model.name}
                          </span>
                          {model.size !== null && (
                            <span className="text-xs text-muted-foreground">
                              {formatBytes(model.size)}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>
          ))}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
