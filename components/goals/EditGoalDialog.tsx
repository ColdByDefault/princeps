"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { cn } from "@/lib/utils";
import type { GoalRecord, LabelOptionRecord } from "@/types/api";
import { DatePicker } from "@/components/ui/date-picker";

type EditGoalDialogProps = {
  goal: GoalRecord;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (
    goalId: string,
    input: Partial<{
      title: string;
      description: string | null;
      status: string;
      targetDate: string | null;
      labelIds: string[];
      taskIds: string[];
      milestones: { title: string; completed: boolean; position: number }[];
    }>,
  ) => Promise<boolean>;
  onAddMilestone: (goalId: string, title: string) => Promise<boolean>;
  onToggleMilestone: (
    goalId: string,
    milestoneId: string,
    completed: boolean,
  ) => Promise<boolean>;
  onDeleteMilestone: (goalId: string, milestoneId: string) => Promise<boolean>;
  updating: string | null;
  milestonePending: string | null;
  availableLabels: LabelOptionRecord[];
  availableTasks: { id: string; title: string; status: string }[];
};

export function EditGoalDialog({
  goal,
  open,
  onOpenChange,
  onUpdate,
  onAddMilestone,
  onToggleMilestone,
  onDeleteMilestone,
  updating,
  milestonePending,
  availableLabels,
  availableTasks,
}: EditGoalDialogProps) {
  const t = useTranslations("goals");

  // Initialise directly from props — no useEffect
  const [title, setTitle] = useState(goal?.title ?? "");
  const [description, setDescription] = useState(goal?.description ?? "");
  const [status, setStatus] = useState(goal?.status ?? "open");
  const [targetDate, setTargetDate] = useState(
    goal?.targetDate
      ? new Date(goal.targetDate).toISOString().slice(0, 10)
      : "",
  );
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>(
    goal?.labels.map((l) => l.id) ?? [],
  );
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>(
    goal?.tasks.map((t) => t.id) ?? [],
  );
  const [newMilestone, setNewMilestone] = useState("");

  if (!goal) return null;

  function toggleLabel(id: string) {
    setSelectedLabelIds((prev) =>
      prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id],
    );
  }

  function toggleTask(id: string) {
    setSelectedTaskIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    const ok = await onUpdate(goal.id, {
      title: title.trim(),
      description: description.trim() || null,
      status,
      targetDate: targetDate ? new Date(targetDate).toISOString() : null,
      labelIds: selectedLabelIds,
      taskIds: selectedTaskIds,
    });

    if (ok) onOpenChange(false);
  }

  async function handleAddMilestone() {
    const trimmed = newMilestone.trim();
    if (!trimmed) return;
    const ok = await onAddMilestone(goal.id, trimmed);
    if (ok) setNewMilestone("");
  }

  const isUpdating = updating === goal.id;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("editDialog.heading")}</DialogTitle>
          <DialogDescription>{t("editDialog.description")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-goal-title">
              {t("fields.title")}
              <span aria-hidden="true" className="ml-0.5 text-destructive">
                *
              </span>
            </Label>
            <Input
              id="edit-goal-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("fields.titlePlaceholder")}
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-goal-description">
              {t("fields.description")}
              <span className="ml-1 text-xs font-normal text-muted-foreground">
                ({t("fields.optional")})
              </span>
            </Label>
            <Textarea
              id="edit-goal-description"
              value={description}
              onChange={(e) => {
                if (e.target.value.length <= 250)
                  setDescription(e.target.value);
              }}
              placeholder={t("fields.descriptionPlaceholder")}
              rows={2}
              className="resize-none"
              maxLength={250}
            />
            <p
              className={cn(
                "text-right text-xs",
                description.length >= 230
                  ? "text-destructive"
                  : "text-muted-foreground",
              )}
            >
              {description.length}/250
            </p>
          </div>

          {/* Status + Target date */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-goal-status">{t("fields.status")}</Label>
              <Select
                value={status}
                onValueChange={(v) => v !== null && setStatus(v)}
              >
                <SelectTrigger
                  id="edit-goal-status"
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
              <Label htmlFor="edit-goal-target-date">
                {t("fields.targetDate")}
                <span className="ml-1 text-xs font-normal text-muted-foreground">
                  ({t("fields.optional")})
                </span>
              </Label>
              <DatePicker
                value={targetDate}
                onChange={setTargetDate}
                placeholder={t("fields.targetDate")}
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

          {/* Linked tasks */}
          {availableTasks.length > 0 && (
            <div className="space-y-1.5">
              <Label>
                {t("fields.linkedTasks")}
                <span className="ml-1 text-xs font-normal text-muted-foreground">
                  ({t("fields.optional")})
                </span>
              </Label>
              <div className="max-h-32 overflow-y-auto space-y-1 rounded-md border border-border/60 p-2">
                {availableTasks.map((task) => (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => toggleTask(task.id)}
                    className={cn(
                      "flex w-full cursor-pointer items-center gap-2 rounded px-2 py-1 text-left text-xs transition-colors",
                      selectedTaskIds.includes(task.id)
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-muted/60",
                    )}
                    aria-pressed={selectedTaskIds.includes(task.id)}
                  >
                    <span
                      className={cn(
                        "size-3.5 shrink-0 rounded border",
                        selectedTaskIds.includes(task.id)
                          ? "border-primary bg-primary text-primary-foreground flex items-center justify-center"
                          : "border-border",
                      )}
                    >
                      {selectedTaskIds.includes(task.id) && (
                        <Check className="size-2.5" />
                      )}
                    </span>
                    <span className="truncate flex-1">{task.title}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Milestones */}
          <div className="space-y-1.5">
            <Label>{t("fields.milestones")}</Label>
            <div className="space-y-1">
              {goal.milestones.map((m) => (
                <div
                  key={m.id}
                  className={cn(
                    "flex items-center gap-2 rounded-md border border-border/60 px-2.5 py-1.5 text-sm",
                    milestonePending === m.id &&
                      "opacity-50 pointer-events-none",
                  )}
                >
                  <button
                    type="button"
                    onClick={() =>
                      onToggleMilestone(goal.id, m.id, !m.completed)
                    }
                    aria-label={
                      m.completed
                        ? t("uncompleteMilestoneLabel")
                        : t("completeMilestoneLabel")
                    }
                    className="cursor-pointer shrink-0"
                  >
                    {m.completed ? (
                      <Check className="size-4 text-green-500" />
                    ) : (
                      <span className="block size-4 rounded-full border border-border" />
                    )}
                  </button>
                  <span
                    className={cn(
                      "flex-1 truncate text-xs",
                      m.completed && "line-through text-muted-foreground",
                    )}
                  >
                    {m.title}
                  </span>
                  <button
                    type="button"
                    onClick={() => onDeleteMilestone(goal.id, m.id)}
                    aria-label={t("removeMilestoneLabel")}
                    className="cursor-pointer text-muted-foreground hover:text-destructive shrink-0"
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
                      void handleAddMilestone();
                    }
                  }}
                  placeholder={t("fields.milestonePlaceholder")}
                  className="flex-1 h-8 text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddMilestone}
                  disabled={!newMilestone.trim() || !!milestonePending}
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
              onClick={() => onOpenChange(false)}
              className="cursor-pointer"
            >
              {t("editDialog.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={isUpdating || !title.trim()}
              className="cursor-pointer"
            >
              {isUpdating ? t("editDialog.submitting") : t("editDialog.submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
