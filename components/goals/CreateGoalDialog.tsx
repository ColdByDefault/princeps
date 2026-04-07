"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import type { LabelOptionRecord } from "@/types/api";

type CreateGoalDialogProps = {
  onSubmit: (input: {
    title: string;
    description?: string | null;
    status?: string;
    targetDate?: string | null;
    labelIds?: string[];
    milestones?: { title: string; position: number }[];
  }) => Promise<boolean>;
  creating: boolean;
  availableLabels: LabelOptionRecord[];
  children: React.ReactNode;
};

export function CreateGoalDialog({
  onSubmit,
  creating,
  availableLabels,
  children,
}: CreateGoalDialogProps) {
  const t = useTranslations("goals");
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("open");
  const [targetDate, setTargetDate] = useState("");
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([]);
  const [milestones, setMilestones] = useState<string[]>([]);
  const [newMilestone, setNewMilestone] = useState("");

  function toggleLabel(id: string) {
    setSelectedLabelIds((prev) =>
      prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id],
    );
  }

  function addMilestone() {
    const trimmed = newMilestone.trim();
    if (!trimmed) return;
    setMilestones((prev) => [...prev, trimmed]);
    setNewMilestone("");
  }

  function removeMilestone(idx: number) {
    setMilestones((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    const ok = await onSubmit({
      title: title.trim(),
      description: description.trim() || null,
      status,
      targetDate: targetDate ? new Date(targetDate).toISOString() : null,
      ...(selectedLabelIds.length && { labelIds: selectedLabelIds }),
      ...(milestones.length && {
        milestones: milestones.map((m, idx) => ({ title: m, position: idx })),
      }),
    });

    if (ok) {
      setOpen(false);
      setTitle("");
      setDescription("");
      setStatus("open");
      setTargetDate("");
      setSelectedLabelIds([]);
      setMilestones([]);
      setNewMilestone("");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={children as React.ReactElement} />
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("createDialog.heading")}</DialogTitle>
          <DialogDescription>{t("createDialog.description")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="goal-title">
              {t("fields.title")}
              <span aria-hidden="true" className="ml-0.5 text-destructive">
                *
              </span>
            </Label>
            <Input
              id="goal-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("fields.titlePlaceholder")}
              required
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="goal-description">
              {t("fields.description")}
              <span className="ml-1 text-xs font-normal text-muted-foreground">
                ({t("fields.optional")})
              </span>
            </Label>
            <Textarea
              id="goal-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("fields.descriptionPlaceholder")}
              rows={2}
              className="resize-none"
            />
          </div>

          {/* Status + Target date */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="goal-status">{t("fields.status")}</Label>
              <Select
                value={status}
                onValueChange={(v) => v !== null && setStatus(v)}
              >
                <SelectTrigger
                  id="goal-status"
                  className="w-full cursor-pointer"
                  aria-label={t("fields.status")}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">{t("status.open")}</SelectItem>
                  <SelectItem value="in_progress">
                    {t("status.in_progress")}
                  </SelectItem>
                  <SelectItem value="done">{t("status.done")}</SelectItem>
                  <SelectItem value="cancelled">
                    {t("status.cancelled")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="goal-target-date">
                {t("fields.targetDate")}
                <span className="ml-1 text-xs font-normal text-muted-foreground">
                  ({t("fields.optional")})
                </span>
              </Label>
              <Input
                id="goal-target-date"
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="cursor-pointer"
              />
            </div>
          </div>

          {/* Labels */}
          {availableLabels.length > 0 && (
            <div className="space-y-1.5">
              <Label>{t("fields.labels")}</Label>
              <div className="flex flex-wrap gap-1.5">
                {availableLabels.map((lbl) => (
                  <button
                    key={lbl.id}
                    type="button"
                    onClick={() => toggleLabel(lbl.id)}
                    className="cursor-pointer rounded-full border px-2.5 py-0.5 text-xs font-medium transition-opacity"
                    style={{
                      backgroundColor: selectedLabelIds.includes(lbl.id)
                        ? lbl.color
                        : "transparent",
                      borderColor: lbl.color,
                      color: selectedLabelIds.includes(lbl.id)
                        ? "#fff"
                        : lbl.color,
                    }}
                    aria-label={lbl.name}
                    aria-pressed={selectedLabelIds.includes(lbl.id)}
                  >
                    {lbl.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Milestones */}
          <div className="space-y-1.5">
            <Label>
              {t("fields.milestones")}
              <span className="ml-1 text-xs font-normal text-muted-foreground">
                ({t("fields.optional")})
              </span>
            </Label>
            <div className="space-y-1">
              {milestones.map((m, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 rounded-md border border-border/60 bg-muted/30 px-2.5 py-1.5 text-sm"
                >
                  <span className="flex-1 truncate">{m}</span>
                  <button
                    type="button"
                    onClick={() => removeMilestone(idx)}
                    aria-label={t("removeMilestoneLabel")}
                    className="cursor-pointer text-muted-foreground hover:text-destructive"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              ))}
              <div className="flex gap-2">
                <Input
                  value={newMilestone}
                  onChange={(e) => setNewMilestone(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addMilestone();
                    }
                  }}
                  placeholder={t("fields.milestonePlaceholder")}
                  className="flex-1 h-8 text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addMilestone}
                  disabled={!newMilestone.trim()}
                  className="cursor-pointer h-8 px-2"
                  aria-label={t("addMilestoneLabel")}
                >
                  <Plus className="size-3.5" />
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="cursor-pointer"
            >
              {t("createDialog.cancel")}
            </Button>
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
