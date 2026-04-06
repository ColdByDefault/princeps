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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { LabelOptionRecord, MeetingRecord } from "@/types/api";

type EditMeetingDialogProps = {
  meeting: MeetingRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (
    meetingId: string,
    input: Partial<{
      title: string;
      scheduledAt: string;
      durationMin: number | null;
      location: string | null;
      status: string;
      labelIds: string[];
    }>,
  ) => Promise<boolean>;
  updating: boolean;
  availableLabels: LabelOptionRecord[];
};

function toDatetimeLocal(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function EditMeetingDialog({
  meeting,
  open,
  onOpenChange,
  onSubmit,
  updating,
  availableLabels,
}: EditMeetingDialogProps) {
  const t = useTranslations("meetings");
  const [title, setTitle] = useState(meeting?.title ?? "");
  const [scheduledAt, setScheduledAt] = useState(
    meeting ? toDatetimeLocal(meeting.scheduledAt) : "",
  );
  const [durationMin, setDurationMin] = useState(
    meeting?.durationMin != null ? String(meeting.durationMin) : "",
  );
  const [location, setLocation] = useState(meeting?.location ?? "");
  const [status, setStatus] = useState(meeting?.status ?? "upcoming");
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>(
    meeting?.labels.map((l) => l.id) ?? [],
  );

  function toggleLabel(id: string) {
    setSelectedLabelIds((prev) =>
      prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id],
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!meeting || !title.trim() || !scheduledAt) return;

    const ok = await onSubmit(meeting.id, {
      title: title.trim(),
      scheduledAt: new Date(scheduledAt).toISOString(),
      durationMin: durationMin ? parseInt(durationMin, 10) : null,
      location: location.trim() || null,
      status,
      labelIds: selectedLabelIds,
    });

    if (ok) onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("editDialog.heading")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="edit-meeting-title">{t("fields.title")}</Label>
            <Input
              id="edit-meeting-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("fields.titlePlaceholder")}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-meeting-scheduled-at">
              {t("fields.scheduledAt")}
            </Label>
            <Input
              id="edit-meeting-scheduled-at"
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-meeting-duration">
                {t("fields.durationMin")}
              </Label>
              <Input
                id="edit-meeting-duration"
                type="number"
                min={1}
                max={1440}
                value={durationMin}
                onChange={(e) => setDurationMin(e.target.value)}
                placeholder={t("fields.durationPlaceholder")}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-meeting-status">{t("fields.status")}</Label>
              <Select
                value={status}
                onValueChange={(v) => {
                  if (v) setStatus(v);
                }}
              >
                <SelectTrigger
                  id="edit-meeting-status"
                  className="cursor-pointer"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="upcoming">
                    {t("status.upcoming")}
                  </SelectItem>
                  <SelectItem value="done">{t("status.done")}</SelectItem>
                  <SelectItem value="cancelled">
                    {t("status.cancelled")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-meeting-location">
              {t("fields.location")}
            </Label>
            <Input
              id="edit-meeting-location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder={t("fields.locationPlaceholder")}
            />
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
              onClick={() => onOpenChange(false)}
              className="cursor-pointer"
            >
              {t("editDialog.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={updating || !title.trim() || !scheduledAt}
              className="cursor-pointer"
            >
              {updating ? t("editDialog.submitting") : t("editDialog.submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
