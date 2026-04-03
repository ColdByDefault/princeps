/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

"use client";

import { useState, useTransition } from "react";
import { RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ProviderStatusPayload } from "@/types/llm";

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

  const providerName =
    status.provider === "openAi"
      ? t("nameOpenAi")
      : status.provider === "ollama"
        ? t("nameOllama")
        : t("nameGroq");

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="space-y-1">
          <CardTitle className="text-base">{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </div>
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
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Provider + Status row */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {t("providerLabel")}
            </p>
            <p className="text-sm font-medium">{providerName}</p>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {t("statusLabel")}
            </p>
            <Badge
              variant={status.health.connected ? "default" : "destructive"}
              className="text-xs"
            >
              {status.health.connected
                ? t("statusConnected")
                : t("statusDisconnected")}
            </Badge>
          </div>

          {status.health.version && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {t("versionLabel")}
              </p>
              <p className="text-sm font-mono">{status.health.version}</p>
            </div>
          )}
        </div>

        {/* Error */}
        {status.health.error && (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {status.health.error}
          </p>
        )}

        {/* Models */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {t("modelsLabel")}
          </p>
          {status.health.models.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("noModels")}</p>
          ) : (
            <div className="divide-y divide-border/60 rounded-lg border border-border/60">
              {status.health.models.map((model) => (
                <div
                  key={model.name}
                  className="flex items-center justify-between px-3 py-2"
                >
                  <span className="text-sm font-mono">{model.name}</span>
                  {model.size !== null && (
                    <span className="text-xs text-muted-foreground">
                      {formatBytes(model.size)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
