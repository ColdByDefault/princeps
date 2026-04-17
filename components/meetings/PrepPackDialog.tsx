/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * SPDX-License-Identifier: Elastic-2.0
 */

"use client";

import { Loader2, RefreshCw, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { MeetingRecord } from "@/types/api";

type PrepPackDialogProps = {
  meeting: MeetingRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: (meetingId: string) => Promise<boolean>;
  generating: boolean;
  onDelete: (meetingId: string) => Promise<boolean>;
  deleting: boolean;
};

export function PrepPackDialog({
  meeting,
  open,
  onOpenChange,
  onGenerate,
  generating,
  onDelete,
  deleting,
}: PrepPackDialogProps) {
  const t = useTranslations("meetings");

  // The key prop on this dialog (keyed by meeting ID) remounts the component
  // when a different meeting is opened, so no manual sync state is needed.
  const displayContent = meeting?.prepPack ?? null;

  async function handleGenerate() {
    if (!meeting) return;
    await onGenerate(meeting.id);
  }

  async function handleDelete() {
    if (!meeting) return;
    await onDelete(meeting.id);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("prepPackDialog.heading")}</DialogTitle>
          {meeting && (
            <p className="text-sm text-muted-foreground">{meeting.title}</p>
          )}
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-2">
          {displayContent ? (
            <div className="prose prose-sm dark:prose-invert max-w-none text-sm">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {displayContent}
              </ReactMarkdown>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm text-muted-foreground">
                {t("prepPackDialog.empty")}
              </p>
            </div>
          )}
        </ScrollArea>

        <DialogFooter className="flex-row justify-between gap-2 sm:justify-between">
          <div className="flex gap-2">
            <Button
              type="button"
              onClick={handleGenerate}
              disabled={generating || deleting || !meeting}
              className="cursor-pointer"
              aria-label={
                displayContent
                  ? t("prepPackDialog.regenerate")
                  : t("prepPackDialog.generate")
              }
            >
              {generating ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 size-4" />
              )}
              {generating
                ? t("prepPackDialog.generating")
                : displayContent
                  ? t("prepPackDialog.regenerate")
                  : t("prepPackDialog.generate")}
            </Button>
            {displayContent && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={deleting || generating || !meeting}
                className="cursor-pointer"
                aria-label={t("prepPackDialog.delete")}
              >
                {deleting ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 size-4" />
                )}
                {t("prepPackDialog.delete")}
              </Button>
            )}
          </div>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="cursor-pointer"
          >
            {t("prepPackDialog.close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
