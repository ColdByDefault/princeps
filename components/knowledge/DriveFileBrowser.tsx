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
import {
  RefreshCw,
  Download,
  CheckCircle2,
  FileText,
  AlertTriangle,
  ChevronDown,
} from "lucide-react";
import { Sheet, Presentation, File } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";

// ─── Types ──────────────────────────────────────────────
interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string | null;
  size: string | null;
  imported: boolean;
}

// ─── Helpers ─────────────────────────────────────────────
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

function DriveFileSkeleton() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <li key={i} className="flex items-center gap-3 px-3 py-2.5">
          <Skeleton className="h-4 w-4 shrink-0 rounded" />
          <Skeleton className="h-3.5 flex-1 rounded" />
          <Skeleton className="hidden sm:block h-3 w-20 rounded shrink-0" />
          <Skeleton className="h-5 w-10 rounded shrink-0" />
          <Skeleton className="h-7 w-16 rounded shrink-0" />
        </li>
      ))}
    </>
  );
}

// ─── Component ────────────────────────────────────────────
export function DriveFileBrowser() {
  const t = useTranslations("knowledge.drive");

  const [files, setFiles] = useState<DriveFile[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, startLoad] = useTransition();
  const [open, setOpen] = useState(true);
  const [importingIds, setImportingIds] = useState<Set<string>>(new Set());

  // ── Load file list ───────────────────────────────────────
  const loadFiles = useCallback(() => {
    setLoadError(null);
    startLoad(async () => {
      const res = await fetch("/api/integrations/google-drive/sync", {
        method: "POST",
      });
      if (res.ok) {
        const data = (await res.json()) as { files: DriveFile[] };
        setFiles(data.files);
      } else {
        const data = (await res.json()) as { error?: string };
        setLoadError(data.error ?? t("errorLoad"));
      }
    });
  }, [t]);

  useEffect(() => {
    loadFiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Import a single file ──────────────────────────────
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
          toast.success(t("importSuccess", { name: file.name }));
        } else {
          const data = (await res.json()) as { error?: string };
          toast.error(data.error ?? t("errorImport"));
        }
      } catch {
        toast.error(t("errorImport"));
      } finally {
        setImportingIds((prev) => {
          const next = new Set(prev);
          next.delete(file.id);
          return next;
        });
      }
    })();
  };

  const mimeLabels = {
    doc: t("fileTypeDoc"),
    sheet: t("fileTypeSheet"),
    slide: t("fileTypeSlide"),
    pdf: t("fileTypePdf"),
  };

  const importedCount = files?.filter((f) => f.imported).length ?? 0;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      {/* ── Collapsible header ── */}
      <div className="flex items-center gap-2">
        <CollapsibleTrigger
          className="flex flex-1 items-center gap-2 rounded-md py-1 text-left"
          aria-label={open ? t("collapse") : t("expand")}
        >
          <ChevronDown
            className={`h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-200 ${
              open ? "rotate-0" : "-rotate-90"
            }`}
          />
          <span className="text-xs font-medium">
            {files !== null
              ? t("fileCount", { count: files.length, imported: importedCount })
              : t("loading")}
          </span>
        </CollapsibleTrigger>

        {loadError && (
          <div className="flex items-center gap-1 text-xs text-destructive">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            <span>{loadError}</span>
          </div>
        )}

        <Button
          size="sm"
          variant="ghost"
          onClick={loadFiles}
          disabled={isLoading}
          aria-label={t("ariaRefresh")}
          className="cursor-pointer h-7 w-7 p-0 shrink-0"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`}
          />
        </Button>
      </div>

      {/* ── Collapsible content ── */}
      <CollapsibleContent>
        <div className="mt-2 rounded-md border overflow-hidden">
          {/* Scrollable list */}
          <div className="overflow-y-auto max-h-96">
            <ul className="divide-y divide-border">
              {isLoading && files === null ? (
                <DriveFileSkeleton />
              ) : files !== null && files.length === 0 ? (
                <li className="px-3 py-8 text-center text-sm text-muted-foreground">
                  {t("noFiles")}
                </li>
              ) : files !== null ? (
                files.map((file) => {
                  const isImporting = importingIds.has(file.id);
                  const mimeLabel = getMimeLabel(file.mimeType, mimeLabels);
                  return (
                    <li
                      key={file.id}
                      className="flex items-center gap-3 px-3 py-2.5 text-sm"
                    >
                      <MimeIcon mimeType={file.mimeType} />
                      <span
                        className="flex-1 min-w-0 truncate text-xs"
                        title={file.name}
                      >
                        {file.name}
                      </span>
                      <span className="hidden sm:block text-[10px] text-muted-foreground shrink-0">
                        {formatDate(file.modifiedTime)}
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
                          aria-label={t("ariaImport", { name: file.name })}
                          title={t("reimportFile")}
                          className="cursor-pointer h-7 px-2 text-[10px] text-muted-foreground hover:text-foreground shrink-0"
                        >
                          {isImporting ? (
                            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <>
                              <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-green-500" />
                              {t("imported")}
                            </>
                          )}
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleImport(file)}
                          disabled={isImporting}
                          aria-label={t("ariaImport", { name: file.name })}
                          className="cursor-pointer h-7 px-2 text-[10px] shrink-0"
                        >
                          {isImporting ? (
                            <>
                              <RefreshCw className="h-3.5 w-3.5 mr-1 animate-spin" />
                              {t("importing")}
                            </>
                          ) : (
                            <>
                              <Download className="h-3.5 w-3.5 mr-1" />
                              {t("importFile")}
                            </>
                          )}
                        </Button>
                      )}
                    </li>
                  );
                })
              ) : null}
            </ul>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
