/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { LabelOptionRecord } from "@/types/api";

type CreateMeetingDialogProps = {
  onSubmit: (input: {
    title: string;
    scheduledAt: string;
    durationMin?: number | null;
    location?: string | null;
    labelIds?: string[];
  }) => Promise<boolean>;
  creating: boolean;
  availableLabels: LabelOptionRecord[];
  children: React.ReactNode;
};

export function CreateMeetingDialog({
  onSubmit,
  creating,
  availableLabels,
  children,
}: CreateMeetingDialogProps) {
  const t = useTranslations("meetings");
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [durationMin, setDurationMin] = useState("");
  const [location, setLocation] = useState("");
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([]);

  function toggleLabel(id: string) {
    setSelectedLabelIds((prev) =>
      prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id],
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !scheduledAt) return;

    const ok = await onSubmit({
      title: title.trim(),
      scheduledAt: new Date(scheduledAt).toISOString(),
      durationMin: durationMin ? parseInt(durationMin, 10) : null,
      location: location.trim() || null,
      ...(selectedLabelIds.length && { labelIds: selectedLabelIds }),
    });

    if (ok) {
      setOpen(false);
      setTitle("");
      setScheduledAt("");
      setDurationMin("");
      setLocation("");
      setSelectedLabelIds([]);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={children as React.ReactElement} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("createDialog.heading")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="meeting-title">
              {t("fields.title")}
              <span aria-hidden="true" className="ml-0.5 text-destructive">
                *
              </span>
            </Label>
            <Input
              id="meeting-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("fields.titlePlaceholder")}
              required
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="meeting-scheduled-at">
              {t("fields.scheduledAt")}
              <span aria-hidden="true" className="ml-0.5 text-destructive">
                *
              </span>
            </Label>
            <Input
              id="meeting-scheduled-at"
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="meeting-duration">
                {t("fields.durationMin")}
                <span className="ml-1 text-xs font-normal text-muted-foreground">
                  ({t("fields.optional")})
                </span>
              </Label>
              <Input
                id="meeting-duration"
                type="number"
                min={1}
                max={1440}
                value={durationMin}
                onChange={(e) => setDurationMin(e.target.value)}
                placeholder={t("fields.durationPlaceholder")}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="meeting-location">
                {t("fields.location")}
                <span className="ml-1 text-xs font-normal text-muted-foreground">
                  ({t("fields.optional")})
                </span>
              </Label>
              <Input
                id="meeting-location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder={t("fields.locationPlaceholder")}
              />
            </div>
          </div>

          {availableLabels.length > 0 && (
            <div className="space-y-1.5">
              <Label>{t("fields.labels")}</Label>
              <div className="flex flex-wrap gap-1.5">
                {availableLabels.map((lbl) => (
                  <button
                    key={lbl.id}
                    type="button"
                    onClick={() => toggleLabel(lbl.id)}
                    className={`cursor-pointer rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors ${
                      selectedLabelIds.includes(lbl.id)
                        ? "border-transparent text-white"
                        : "border-border bg-background text-muted-foreground hover:bg-muted"
                    }`}
                    style={
                      selectedLabelIds.includes(lbl.id)
                        ? { backgroundColor: lbl.color }
                        : undefined
                    }
                    aria-pressed={selectedLabelIds.includes(lbl.id)}
                    aria-label={lbl.name}
                  >
                    {lbl.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              className="cursor-pointer"
            >
              {t("createDialog.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={creating || !title.trim() || !scheduledAt}
              className="cursor-pointer"
            >
              {creating
                ? t("createDialog.submitting")
                : t("createDialog.submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
