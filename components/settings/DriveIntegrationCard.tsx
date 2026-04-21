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

import { useState, useTransition, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import {
  Unplug,
  Plug,
  AlertTriangle,
  RefreshCw,
  Download,
  CheckCircle2,
  FileText,
  Sheet,
  Presentation,
  File,
} from "lucide-react";
import { toast } from "sonner";
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
import Link from "next/link";
import type { IntegrationInfo } from "./IntegrationCard";

// ─── Types ────────────────────────────────────────────────

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string | null;
  size: string | null;
  imported: boolean;
}

type DriveIntegrationCardProps = {
  connected: IntegrationInfo | null;
  onDisconnected: (provider: string) => void;
  onSynced: (provider: string, lastSyncedAt: string) => void;
};

// ─── Helpers ──────────────────────────────────────────────

function getMimeLabel(
  mimeType: string,
  labels: { doc: string; sheet: string; slide: string; pdf: string },
): string {
  if (mimeType.includes("document")) return labels.doc;
  if (mimeType.includes("spreadsheet")) return labels.sheet;
  if (mimeType.includes("presentation")) return labels.slide;
  if (mimeType === "application/pdf") return labels.pdf;
  return "File";
}

function MimeIcon({ mimeType }: { mimeType: string }) {
  if (mimeType.includes("spreadsheet")) {
    return <Sheet className="h-4 w-4 shrink-0 text-muted-foreground" />;
  }
  if (mimeType.includes("presentation")) {
    return <Presentation className="h-4 w-4 shrink-0 text-muted-foreground" />;
  }
  if (mimeType.includes("document")) {
    return <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />;
  }
  return <File className="h-4 w-4 shrink-0 text-muted-foreground" />;
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(
    new Date(iso),
  );
}

// ─── Component ────────────────────────────────────────────

export function DriveIntegrationCard({
  connected,
  onDisconnected,
  onSynced,
}: DriveIntegrationCardProps) {
  const t = useTranslations("settings.integrations");
  const td = useTranslations("settings.integrations.drive");

  const [files, setFiles] = useState<DriveFile[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, startLoad] = useTransition();
  const [isDisconnecting, startDisconnect] = useTransition();

  // Per-file import state: fileId → true while importing
  const [importingIds, setImportingIds] = useState<Set<string>>(new Set());

  // ── Load/refresh file list ──────────────────────────────
  const loadFiles = useCallback(() => {
    setLoadError(null);
    startLoad(async () => {
      const res = await fetch("/api/integrations/google-drive/sync", {
        method: "POST",
      });
      if (res.ok) {
        const data = (await res.json()) as { files: DriveFile[] };
        setFiles(data.files);
        onSynced("google_drive", new Date().toISOString());
      } else {
        const data = (await res.json()) as { error?: string };
        if (res.status === 401) {
          setLoadError(t("errorExpired"));
        } else {
          setLoadError(data.error ?? td("errorLoad"));
        }
      }
    });
  }, [t, td, onSynced]);

  // Auto-load when connected
  useEffect(() => {
    if (connected && files === null && !isLoading) {
      loadFiles();
    }
  }, [connected, files, isLoading, loadFiles]);

  // ── Import a single file ────────────────────────────────
  const handleImport = (file: DriveFile) => {
    setImportingIds((prev) => new Set(prev).add(file.id));
    void (async () => {
      try {
        const res = await fetch("/api/integrations/google-drive/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileId: file.id }),
        });
        if (res.ok) {
          setFiles((prev) =>
            prev
              ? prev.map((f) =>
                  f.id === file.id ? { ...f, imported: true } : f,
                )
              : prev,
          );
          toast.success(td("importSuccess", { name: file.name }));
        } else {
          const data = (await res.json()) as { error?: string };
          toast.error(data.error ?? td("errorImport"));
        }
      } catch {
        toast.error(td("errorImport"));
      } finally {
        setImportingIds((prev) => {
          const next = new Set(prev);
          next.delete(file.id);
          return next;
        });
      }
    })();
  };

  // ── Disconnect ──────────────────────────────────────────
  const handleDisconnect = () => {
    startDisconnect(async () => {
      const res = await fetch("/api/integrations/google-drive/disconnect", {
        method: "DELETE",
      });
      if (res.ok) {
        setFiles(null);
        onDisconnected("google_drive");
      } else {
        toast.error(t("errorDisconnect"));
      }
    });
  };

  return (
    <Card>
      {/* ── Header ── */}
      <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-2">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border bg-muted">
          <Image
            src="/icons/googleDrive.png"
            alt="Google Drive"
            width={20}
            height={20}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-medium">Google Drive</CardTitle>
            {connected && (
              <Badge variant="secondary" className="text-xs bg-green-800 p-1">
                {t("badgeConnected")}
              </Badge>
            )}
          </div>
          <CardDescription className="text-xs mt-0.5">
            {td("description")}
          </CardDescription>
        </div>
      </CardHeader>

      {/* ── Last synced / error ── */}
      {connected && (
        <CardContent className="pb-2">
          <p className="text-xs text-muted-foreground">
            {t("lastSynced")}: {formatDate(connected.lastSyncedAt)}
          </p>
          {loadError && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-destructive">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              <span>{loadError}</span>
            </div>
          )}
        </CardContent>
      )}

      {/* ── File browser ── */}
      {connected && (
        <CardContent className="pt-0 pb-3">
          {isLoading && files === null ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              <span>{t("syncing")}</span>
            </div>
          ) : files !== null && files.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2">
              {td("noFiles")}
            </p>
          ) : files !== null && files.length > 0 ? (
            <ul className="divide-y divide-border rounded-md border max-h-72 overflow-y-auto">
              {files.map((file) => {
                const isImporting = importingIds.has(file.id);
                const mimeLabel = getMimeLabel(file.mimeType, {
                  doc: td("fileTypeDoc"),
                  sheet: td("fileTypeSheet"),
                  slide: td("fileTypeSlide"),
                  pdf: td("fileTypePdf"),
                });
                return (
                  <li
                    key={file.id}
                    className="flex items-center gap-2 px-3 py-2 text-xs"
                  >
                    <MimeIcon mimeType={file.mimeType} />
                    <span className="flex-1 min-w-0 truncate" title={file.name}>
                      {file.name}
                    </span>
                    <Badge
                      variant="outline"
                      className="shrink-0 text-[10px] px-1.5 py-0"
                    >
                      {mimeLabel}
                    </Badge>
                    {file.imported ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleImport(file)}
                        disabled={isImporting}
                        aria-label={td("ariaImport", { name: file.name })}
                        title={td("reimportFile")}
                        className="cursor-pointer h-6 px-2 text-[10px] text-muted-foreground hover:text-foreground"
                      >
                        {isImporting ? (
                          <RefreshCw className="h-3 w-3 animate-spin" />
                        ) : (
                          <>
                            <CheckCircle2 className="h-3 w-3 mr-1 text-green-500" />
                            {td("imported")}
                          </>
                        )}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleImport(file)}
                        disabled={isImporting}
                        aria-label={td("ariaImport", { name: file.name })}
                        className="cursor-pointer h-6 px-2 text-[10px]"
                      >
                        {isImporting ? (
                          <>
                            <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                            {td("importing")}
                          </>
                        ) : (
                          <>
                            <Download className="h-3 w-3 mr-1" />
                            {td("importFile")}
                          </>
                        )}
                      </Button>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : null}
        </CardContent>
      )}

      {/* ── Footer ── */}
      <CardFooter className="gap-2 pt-2">
        {connected ? (
          <>
            <Button
              size="sm"
              variant="outline"
              onClick={loadFiles}
              disabled={isLoading || isDisconnecting}
              aria-label={td("ariaRefresh")}
              className="cursor-pointer"
            >
              <RefreshCw
                className={`mr-1.5 h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`}
              />
              {isLoading ? t("syncing") : td("refreshFiles")}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDisconnect}
              disabled={isLoading || isDisconnecting}
              aria-label={t("ariaDisconnect", { provider: "Google Drive" })}
              className="cursor-pointer text-muted-foreground hover:text-destructive"
            >
              <Unplug className="mr-1.5 h-3.5 w-3.5" />
              {isDisconnecting ? t("disconnecting") : t("disconnect")}
            </Button>
          </>
        ) : (
          <Link
            href="/api/integrations/google-drive/connect"
            aria-label={t("ariaConnect", { provider: "Google Drive" })}
            className="inline-flex cursor-pointer items-center rounded-lg border border-transparent bg-primary px-2.5 py-1 text-[0.8rem] font-medium text-primary-foreground transition-all hover:bg-primary/80"
          >
            <Plug className="mr-1.5 h-3.5 w-3.5" />
            {t("connect")}
          </Link>
        )}
      </CardFooter>
    </Card>
  );
}
