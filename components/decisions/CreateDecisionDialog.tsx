"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import type { LabelOptionRecord, MeetingRecord } from "@/types/api";

type CreateDecisionDialogProps = {
  onSubmit: (input: {
    title: string;
    rationale?: string | null;
    outcome?: string | null;
    status?: string;
    decidedAt?: string | null;
    meetingId?: string | null;
    labelIds?: string[];
  }) => Promise<boolean>;
  creating: boolean;
  availableLabels: LabelOptionRecord[];
  availableMeetings: MeetingRecord[];
  children: React.ReactNode;
};

export function CreateDecisionDialog({
  onSubmit,
  creating,
  availableLabels,
  availableMeetings,
  children,
}: CreateDecisionDialogProps) {
  const t = useTranslations("decisions");
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [rationale, setRationale] = useState("");
  const [outcome, setOutcome] = useState("");
  const [status, setStatus] = useState("open");
  const [decidedAt, setDecidedAt] = useState("");
  const [meetingId, setMeetingId] = useState<string>("");
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([]);

  function toggleLabel(id: string) {
    setSelectedLabelIds((prev) =>
      prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id],
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    const ok = await onSubmit({
      title: title.trim(),
      rationale: rationale.trim() || null,
      outcome: outcome.trim() || null,
      status,
      decidedAt: decidedAt ? new Date(decidedAt).toISOString() : null,
      meetingId: meetingId || null,
      ...(selectedLabelIds.length && { labelIds: selectedLabelIds }),
    });

    if (ok) {
      setOpen(false);
      setTitle("");
      setRationale("");
      setOutcome("");
      setStatus("open");
      setDecidedAt("");
      setMeetingId("");
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
            <Label htmlFor="decision-title">
              {t("fields.title")}
              <span aria-hidden="true" className="ml-0.5 text-destructive">
                *
              </span>
            </Label>
            <Input
              id="decision-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("fields.titlePlaceholder")}
              required
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="decision-rationale">
              {t("fields.rationale")}
              <span className="ml-1 text-xs font-normal text-muted-foreground">
                ({t("fields.optional")})
              </span>
            </Label>
            <Textarea
              id="decision-rationale"
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
              placeholder={t("fields.rationalePlaceholder")}
              rows={2}
              className="resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="decision-outcome">
              {t("fields.outcome")}
              <span className="ml-1 text-xs font-normal text-muted-foreground">
                ({t("fields.optional")})
              </span>
            </Label>
            <Textarea
              id="decision-outcome"
              value={outcome}
              onChange={(e) => setOutcome(e.target.value)}
              placeholder={t("fields.outcomePlaceholder")}
              rows={2}
              className="resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="decision-status">{t("fields.status")}</Label>
              <Select
                value={status}
                onValueChange={(v) => v !== null && setStatus(v)}
              >
                <SelectTrigger
                  id="decision-status"
                  className="w-full cursor-pointer"
                  aria-label={t("fields.status")}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">{t("status.open")}</SelectItem>
                  <SelectItem value="decided">{t("status.decided")}</SelectItem>
                  <SelectItem value="reversed">
                    {t("status.reversed")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="decision-decided-at">
                {t("fields.decidedAt")}
                <span className="ml-1 text-xs font-normal text-muted-foreground">
                  ({t("fields.optional")})
                </span>
              </Label>
              <Input
                id="decision-decided-at"
                type="date"
                value={decidedAt}
                onChange={(e) => setDecidedAt(e.target.value)}
                className="cursor-pointer"
                placeholder={t("fields.decidedAt")}
              />
            </div>
          </div>

          {availableMeetings.length > 0 && (
            <div className="space-y-1.5">
              <Label htmlFor="decision-meeting">
                {t("fields.linkedMeeting")}
                <span className="ml-1 text-xs font-normal text-muted-foreground">
                  ({t("fields.optional")})
                </span>
              </Label>
              <Select
                value={meetingId}
                onValueChange={(v) =>
                  setMeetingId(v === "__none" || v === null ? "" : v)
                }
              >
                <SelectTrigger
                  id="decision-meeting"
                  className="w-full cursor-pointer"
                  aria-label={t("fields.linkedMeeting")}
                >
                  <SelectValue placeholder={t("fields.noMeeting")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">
                    {t("fields.noMeeting")}
                  </SelectItem>
                  {availableMeetings.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {availableLabels.length > 0 && (
            <div className="space-y-1.5">
              <Label>
                {t("fields.labels")}
                <span className="ml-1 text-xs font-normal text-muted-foreground">
                  ({t("fields.optional")})
                </span>
              </Label>
              <div className="flex flex-wrap gap-1.5">
                {availableLabels.map((label) => {
                  const selected = selectedLabelIds.includes(label.id);
                  return (
                    <button
                      key={label.id}
                      type="button"
                      onClick={() => toggleLabel(label.id)}
                      aria-label={label.name}
                      aria-pressed={selected}
                      className={cn(
                        "inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
                        selected
                          ? "border-transparent text-white"
                          : "border-border bg-muted/40 text-muted-foreground hover:text-foreground",
                      )}
                      style={selected ? { backgroundColor: label.color } : {}}
                    >
                      <span
                        className="size-1.5 rounded-full shrink-0"
                        style={{
                          backgroundColor: selected ? "white" : label.color,
                        }}
                      />
                      {label.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="submit"
              disabled={creating || !title.trim()}
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
