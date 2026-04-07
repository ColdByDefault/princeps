"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import type {
  DecisionRecord,
  LabelOptionRecord,
  MeetingRecord,
} from "@/types/api";

type EditDecisionDialogProps = {
  decision: DecisionRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (
    decisionId: string,
    input: Partial<{
      title: string;
      rationale: string | null;
      outcome: string | null;
      status: string;
      decidedAt: string | null;
      meetingId: string | null;
      labelIds: string[];
    }>,
  ) => Promise<boolean>;
  updating: boolean;
  availableLabels: LabelOptionRecord[];
  availableMeetings: MeetingRecord[];
};

export function EditDecisionDialog({
  decision,
  open,
  onOpenChange,
  onSubmit,
  updating,
  availableLabels,
  availableMeetings,
}: EditDecisionDialogProps) {
  const t = useTranslations("decisions");
  const [title, setTitle] = useState(decision?.title ?? "");
  const [rationale, setRationale] = useState(decision?.rationale ?? "");
  const [outcome, setOutcome] = useState(decision?.outcome ?? "");
  const [status, setStatus] = useState(decision?.status ?? "open");
  const [decidedAt, setDecidedAt] = useState(
    decision?.decidedAt ? decision.decidedAt.slice(0, 10) : "",
  );
  const [meetingId, setMeetingId] = useState(decision?.meetingId ?? "");
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>(
    decision?.labels.map((l) => l.id) ?? [],
  );

  function toggleLabel(id: string) {
    setSelectedLabelIds((prev) =>
      prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id],
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!decision || !title.trim()) return;

    const ok = await onSubmit(decision.id, {
      title: title.trim(),
      rationale: rationale.trim() || null,
      outcome: outcome.trim() || null,
      status,
      decidedAt: decidedAt ? new Date(decidedAt).toISOString() : null,
      meetingId: meetingId || null,
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
            <Label htmlFor="edit-decision-title">
              {t("fields.title")}
              <span aria-hidden="true" className="ml-0.5 text-destructive">
                *
              </span>
            </Label>
            <Input
              id="edit-decision-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("fields.titlePlaceholder")}
              required
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-decision-rationale">
              {t("fields.rationale")}
              <span className="ml-1 text-xs font-normal text-muted-foreground">
                ({t("fields.optional")})
              </span>
            </Label>
            <Textarea
              id="edit-decision-rationale"
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
              placeholder={t("fields.rationalePlaceholder")}
              rows={2}
              className="resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-decision-outcome">
              {t("fields.outcome")}
              <span className="ml-1 text-xs font-normal text-muted-foreground">
                ({t("fields.optional")})
              </span>
            </Label>
            <Textarea
              id="edit-decision-outcome"
              value={outcome}
              onChange={(e) => setOutcome(e.target.value)}
              placeholder={t("fields.outcomePlaceholder")}
              rows={2}
              className="resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-decision-status">{t("fields.status")}</Label>
              <Select
                value={status}
                onValueChange={(v) => v !== null && setStatus(v)}
              >
                <SelectTrigger
                  id="edit-decision-status"
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
              <Label htmlFor="edit-decision-decided-at">
                {t("fields.decidedAt")}
                <span className="ml-1 text-xs font-normal text-muted-foreground">
                  ({t("fields.optional")})
                </span>
              </Label>
              <Input
                id="edit-decision-decided-at"
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
              <Label htmlFor="edit-decision-meeting">
                {t("fields.linkedMeeting")}
                <span className="ml-1 text-xs font-normal text-muted-foreground">
                  ({t("fields.optional")})
                </span>
              </Label>
              <Select
                value={meetingId || "__none"}
                onValueChange={(v) => setMeetingId(v === "__none" || v === null ? "" : v)}
              >
                <SelectTrigger
                  id="edit-decision-meeting"
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
              disabled={updating || !title.trim()}
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
