/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

"use client";

import { useRef, useState } from "react";
import { Upload, FileText, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

// Accepted MIME types and extensions
const ACCEPTED_TYPES = ["text/plain", "text/markdown", "text/x-markdown"];
const ACCEPTED_EXTENSIONS = [".txt", ".md", ".markdown"];

type UploadFormProps = {
  uploading: boolean;
  onUpload: (file: File) => Promise<boolean>;
};

export function UploadForm({ uploading, onUpload }: UploadFormProps) {
  const t = useTranslations("knowledge");
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  function isAccepted(file: File): boolean {
    const ext = file.name.toLowerCase().split(".").pop() ?? "";
    return (
      ACCEPTED_TYPES.includes(file.type) ||
      ACCEPTED_EXTENSIONS.includes(`.${ext}`)
    );
  }

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const file = files[0]!;
    if (!isAccepted(file)) return;
    setPendingFile(file);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragging(true);
  }

  function handleDragLeave() {
    setDragging(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!pendingFile || uploading) return;
    const ok = await onUpload(pendingFile);
    if (ok) setPendingFile(null);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Drop zone */}
      <div
        role="button"
        tabIndex={0}
        aria-label={t("dropZoneAriaLabel")}
        className={`flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed p-8 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
          dragging
            ? "border-primary bg-primary/5"
            : "border-border/60 hover:border-primary/50 hover:bg-accent/20"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
      >
        <div className="rounded-full bg-primary/10 p-3">
          <Upload className="size-5 text-primary" aria-hidden="true" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium">{t("dropZoneTitle")}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("dropZoneSubtitle")}
          </p>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_EXTENSIONS.join(",")}
        className="sr-only"
        aria-hidden="true"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {/* Selected file preview */}
      {pendingFile && (
        <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/40 px-3 py-2">
          <FileText
            className="size-4 shrink-0 text-primary"
            aria-hidden="true"
          />
          <span className="min-w-0 flex-1 truncate text-sm">
            {pendingFile.name}
          </span>
          <span className="shrink-0 text-xs text-muted-foreground">
            {(pendingFile.size / 1_000).toFixed(0)} KB
          </span>
          <button
            type="button"
            className="cursor-pointer shrink-0 rounded text-muted-foreground hover:text-foreground"
            aria-label={t("clearFileAriaLabel")}
            onClick={() => setPendingFile(null)}
          >
            <X className="size-3.5" aria-hidden="true" />
          </button>
        </div>
      )}

      <Button
        type="submit"
        className="w-full cursor-pointer"
        disabled={!pendingFile || uploading}
        aria-label={t("uploadButtonAriaLabel")}
        suppressHydrationWarning
      >
        {uploading ? t("uploadingLabel") : t("uploadButton")}
      </Button>
    </form>
  );
}
