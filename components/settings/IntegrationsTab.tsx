/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getMessage } from "@/lib/i18n";
import { type MessageDictionary } from "@/types/i18n";
import { CalendarDays, RefreshCw, Unplug } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

type IntegrationStatus = {
  connected: boolean;
  integration: { lastSyncedAt: string | null; createdAt: string } | null;
};

type Props = {
  messages: MessageDictionary;
  oauthSuccess: string | undefined;
  oauthError: string | undefined;
};

export function IntegrationsTab({ messages, oauthSuccess, oauthError }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<IntegrationStatus | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  useEffect(() => {
    void fetch("/api/integrations/google")
      .then((r) => r.json() as Promise<IntegrationStatus>)
      .then((data) => setStatus(data))
      .catch(() => setStatus({ connected: false, integration: null }));
  }, []);

  // B1: show OAuth result toast once on mount and clean the URL
  useEffect(() => {
    if (oauthSuccess === "google_connected") {
      toast.success(
        getMessage(
          messages,
          "integrations.google.connectSuccess",
          "Google Calendar connected successfully.",
        ),
      );
      router.replace("/settings/app?tab=integrations");
    } else if (oauthError === "google_denied") {
      toast.error(
        getMessage(
          messages,
          "integrations.google.errorDenied",
          "Google Calendar access was denied.",
        ),
      );
      router.replace("/settings/app?tab=integrations");
    } else if (oauthError === "google_state_invalid") {
      toast.error(
        getMessage(
          messages,
          "integrations.google.errorInvalid",
          "OAuth state was invalid. Please try again.",
        ),
      );
      router.replace("/settings/app?tab=integrations");
    } else if (oauthError) {
      toast.error(
        getMessage(
          messages,
          "integrations.google.errorFailed",
          "Failed to connect Google Calendar. Please try again.",
        ),
      );
      router.replace("/settings/app?tab=integrations");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/integrations/google/sync", {
        method: "POST",
      });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { upserted: number; skipped: number };
      // Refresh status to get updated lastSyncedAt
      const updated = await fetch("/api/integrations/google").then(
        (r) => r.json() as Promise<IntegrationStatus>,
      );
      setStatus(updated);
      const countMsg = getMessage(
        messages,
        "integrations.google.syncCount",
        "{upserted} events synced, {skipped} skipped.",
      )
        .replace("{upserted}", String(data.upserted))
        .replace("{skipped}", String(data.skipped));
      toast.success(countMsg);
    } catch {
      toast.error(
        getMessage(
          messages,
          "integrations.google.syncError",
          "Sync failed. Please try again.",
        ),
      );
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      const res = await fetch("/api/integrations/google", { method: "DELETE" });
      if (!res.ok) throw new Error();
      setStatus({ connected: false, integration: null });
      toast.success(
        getMessage(
          messages,
          "integrations.google.disconnectSuccess",
          "Google Calendar disconnected.",
        ),
      );
    } catch {
      toast.error(
        getMessage(
          messages,
          "integrations.google.syncError",
          "Failed to disconnect.",
        ),
      );
    } finally {
      setDisconnecting(false);
    }
  };

  if (status === null) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-64 mt-1.5" />
        </div>
        <div className="rounded-xl border border-border/70 bg-card/50 p-5 space-y-4">
          <div className="flex items-start gap-4">
            <Skeleton className="size-9 rounded-lg shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-72" />
            </div>
          </div>
          <Skeleton className="h-8 w-44 rounded-md" />
        </div>
      </div>
    );
  }

  const lastSynced = status?.integration?.lastSyncedAt
    ? new Date(status.integration.lastSyncedAt).toLocaleString()
    : getMessage(messages, "integrations.google.never", "Never");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-sm font-semibold">
          {getMessage(messages, "integrations.title", "Integrations")}
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          {getMessage(
            messages,
            "integrations.description",
            "Connect external services to sync data into your workspace.",
          )}
        </p>
      </div>

      {/* Google Calendar card */}
      <div className="rounded-xl border border-border/70 bg-card/50 p-5 space-y-4">
        <div className="flex items-start gap-4">
          <div className="flex size-9 items-center justify-center rounded-lg border border-border/60 bg-background/60 shrink-0">
            <CalendarDays className="size-5 text-blue-500" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium">
                {getMessage(
                  messages,
                  "integrations.google.title",
                  "Google Calendar",
                )}
              </span>
              {status?.connected && (
                <Badge
                  variant="outline"
                  className="text-emerald-600 border-emerald-500/40 bg-emerald-500/10 text-xs"
                >
                  {getMessage(
                    messages,
                    "integrations.google.connected",
                    "Connected",
                  )}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {getMessage(
                messages,
                "integrations.google.description",
                "Import upcoming events from your primary Google Calendar.",
              )}
            </p>
            {status?.connected && (
              <p className="text-xs text-muted-foreground mt-1">
                {getMessage(
                  messages,
                  "integrations.google.lastSynced",
                  "Last synced",
                )}
                : {lastSynced}
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          {!status?.connected ? (
            <Button
              size="sm"
              variant="outline"
              className="cursor-pointer"
              onClick={() => {
                window.location.href = "/api/integrations/google/connect";
              }}
            >
              <CalendarDays className="size-3.5 mr-1.5" />
              {getMessage(
                messages,
                "integrations.google.connect",
                "Connect Google Calendar",
              )}
            </Button>
          ) : (
            <>
              <Button
                size="sm"
                variant="outline"
                className="cursor-pointer"
                onClick={() => void handleSync()}
                disabled={syncing}
                aria-label={getMessage(
                  messages,
                  "integrations.google.syncNow",
                  "Sync now",
                )}
              >
                <RefreshCw
                  className={`size-3.5 mr-1.5 ${syncing ? "animate-spin" : ""}`}
                />
                {syncing
                  ? getMessage(
                      messages,
                      "integrations.google.syncing",
                      "Syncing…",
                    )
                  : getMessage(
                      messages,
                      "integrations.google.syncNow",
                      "Sync now",
                    )}
              </Button>
              <AlertDialog>
                <AlertDialogTrigger
                  className="inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-destructive hover:bg-accent hover:text-destructive cursor-pointer disabled:pointer-events-none disabled:opacity-50"
                  disabled={disconnecting}
                  aria-label={getMessage(
                    messages,
                    "integrations.google.disconnect",
                    "Disconnect",
                  )}
                >
                  <Unplug className="size-3.5" />
                  {disconnecting
                    ? getMessage(
                        messages,
                        "integrations.google.disconnecting",
                        "Disconnecting…",
                      )
                    : getMessage(
                        messages,
                        "integrations.google.disconnect",
                        "Disconnect",
                      )}
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {getMessage(
                        messages,
                        "integrations.google.disconnectConfirmTitle",
                        "Disconnect Google Calendar?",
                      )}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {getMessage(
                        messages,
                        "integrations.google.disconnectConfirmDescription",
                        "This will remove the integration and stop syncing events. You can reconnect at any time.",
                      )}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>
                      {getMessage(
                        messages,
                        "integrations.google.disconnectCancel",
                        "Cancel",
                      )}
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => void handleDisconnect()}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {getMessage(
                        messages,
                        "integrations.google.disconnectConfirm",
                        "Disconnect",
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
