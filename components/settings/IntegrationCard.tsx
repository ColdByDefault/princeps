/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import {
  CalendarDays,
  RefreshCw,
  Unplug,
  Plug,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

export interface IntegrationInfo {
  provider: string;
  lastSyncedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

type IntegrationCardProps = {
  provider: string;
  connected: IntegrationInfo | null;
  onDisconnected: (provider: string) => void;
  onSynced: (provider: string, lastSyncedAt: string) => void;
};

const PROVIDER_META: Record<
  string,
  {
    label: string;
    description: string;
    icon: React.ReactNode;
    connectHref: string;
  }
> = {
  google_calendar: {
    label: "Google Calendar",
    description: "Sync events from Google Calendar as appointments.",
    icon: <CalendarDays className="h-5 w-5" />,
    connectHref: "/api/integrations/google-calendar/connect",
  },
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function IntegrationCard({
  provider,
  connected,
  onDisconnected,
  onSynced,
}: IntegrationCardProps) {
  const t = useTranslations("settings.integrations");
  const meta = PROVIDER_META[provider];
  const [isSyncing, startSync] = useTransition();
  const [isDisconnecting, startDisconnect] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSync = () => {
    setError(null);
    startSync(async () => {
      const res = await fetch(
        `/api/integrations/${provider.replace("_", "-")}/sync`,
        {
          method: "POST",
        },
      );
      if (res.ok) {
        const data = (await res.json()) as { created: number; updated: number };
        onSynced(provider, new Date().toISOString());
        setError(null);
        void data;
      } else {
        const data = (await res.json()) as { error?: string };
        if (res.status === 401) {
          setError(t("errorExpired"));
        } else {
          setError(data.error ?? t("errorSync"));
        }
      }
    });
  };

  const handleDisconnect = () => {
    setError(null);
    startDisconnect(async () => {
      const res = await fetch(
        `/api/integrations/${provider.replace("_", "-")}/disconnect`,
        {
          method: "DELETE",
        },
      );
      if (res.ok) {
        onDisconnected(provider);
      } else {
        setError(t("errorDisconnect"));
      }
    });
  };

  if (!meta) return null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-2">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border bg-muted">
          {meta.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-medium">{meta.label}</CardTitle>
            {connected && (
              <Badge variant="secondary" className="text-xs">
                {t("badgeConnected")}
              </Badge>
            )}
          </div>
          <CardDescription className="text-xs mt-0.5">
            {meta.description}
          </CardDescription>
        </div>
      </CardHeader>

      {connected && (
        <CardContent className="pb-2">
          <p className="text-xs text-muted-foreground">
            {t("lastSynced")}: {formatDate(connected.lastSyncedAt)}
          </p>
          {error && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-destructive">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </CardContent>
      )}

      <CardFooter className="gap-2 pt-2">
        {connected ? (
          <>
            <Button
              size="sm"
              variant="outline"
              onClick={handleSync}
              disabled={isSyncing || isDisconnecting}
              aria-label={t("ariaSync", { provider: meta.label })}
              className="cursor-pointer"
            >
              <RefreshCw
                className={`mr-1.5 h-3.5 w-3.5 ${isSyncing ? "animate-spin" : ""}`}
              />
              {isSyncing ? t("syncing") : t("syncNow")}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDisconnect}
              disabled={isSyncing || isDisconnecting}
              aria-label={t("ariaDisconnect", { provider: meta.label })}
              className="cursor-pointer text-muted-foreground hover:text-destructive"
            >
              <Unplug className="mr-1.5 h-3.5 w-3.5" />
              {isDisconnecting ? t("disconnecting") : t("disconnect")}
            </Button>
          </>
        ) : (
          <a
            href={meta.connectHref}
            aria-label={t("ariaConnect", { provider: meta.label })}
            className="inline-flex cursor-pointer items-center rounded-lg border border-transparent bg-primary px-2.5 py-1 text-[0.8rem] font-medium text-primary-foreground transition-all hover:bg-primary/80"
          >
            <Plug className="mr-1.5 h-3.5 w-3.5" />
            {t("connect")}
          </a>
        )}
      </CardFooter>
    </Card>
  );
}
