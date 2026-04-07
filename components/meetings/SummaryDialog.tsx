/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { MeetingRecord } from "@/types/api";

type SummaryDialogProps = {
  meeting: MeetingRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (meetingId: string, summary: string | null) => Promise<boolean>;
  updating: boolean;
};

export function SummaryDialog({
  meeting,
  open,
  onOpenChange,
  onSubmit,
  updating,
}: SummaryDialogProps) {
  const t = useTranslations("meetings");
  const [summary, setSummary] = useState(meeting?.summary ?? "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!meeting) return;
    const ok = await onSubmit(meeting.id, summary.trim() || null);
    if (ok) onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("summaryDialog.heading")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Textarea
            value={summary}
            onChange={(e) => {
              if (e.target.value.length <= 500) setSummary(e.target.value);
            }}
            placeholder={t("fields.summaryPlaceholder")}
            rows={6}
            className="resize-none"
            maxLength={500}
            autoFocus
          />
          <p
            className={cn(
              "text-right text-xs",
              summary.length >= 470
                ? "text-destructive"
                : "text-muted-foreground",
            )}
          >
            {summary.length}/500
          </p>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="cursor-pointer"
            >
              {t("summaryDialog.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={updating}
              className="cursor-pointer"
            >
              {updating
                ? t("summaryDialog.submitting")
                : t("summaryDialog.submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
