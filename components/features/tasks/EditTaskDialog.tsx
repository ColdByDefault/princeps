/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version canary-v1.1.8
 * @since beta
 */

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/core/utils";
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
import type { LabelOptionRecord, TaskRecord } from "@/types/api";
import { DatePicker } from "@/components/ui/date-picker";
import { Checkbox } from "@/components/ui/checkbox";

type EditTaskDialogProps = {
  task: TaskRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (
    taskId: string,
    input: Partial<{
      title: string;
      notes: string | null;
      status: string;
      priority: string;
      dueDate: string | null;
      labelIds: string[];
      goalIds: string[];
      delegatedTo: string | null;
      delegateNotes: string | null;
    }>,
  ) => Promise<boolean>;
  updating: boolean;
  availableLabels: LabelOptionRecord[];
  availableGoals: { id: string; title: string }[];
};

export function EditTaskDialog({
  task,
  open,
  onOpenChange,
  onSubmit,
  updating,
  availableLabels,
  availableGoals,
}: EditTaskDialogProps) {
  const t = useTranslations("tasks");
const tCommon = useTranslations("common");
  const [title, setTitle] = useState(task?.title ?? "");
  const [notes, setNotes] = useState(task?.notes ?? "");
  const [priority, setPriority] = useState(task?.priority ?? "normal");
  const [status, setStatus] = useState(task?.status ?? "open");
  const [dueDate, setDueDate] = useState(
    task?.dueDate ? task.dueDate.slice(0, 10) : "",
  );
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>(
    task?.labels.map((l) => l.id) ?? [],
  );
  const [selectedGoalIds, setSelectedGoalIds] = useState<string[]>(
    task?.goals.map((g) => g.id) ?? [],
  );
  const [delegatedTo, setDelegatedTo] = useState(task?.delegatedTo ?? "");
  const [delegateNotes, setDelegateNotes] = useState(task?.delegateNotes ?? "");

  function toggleLabel(id: string) {
    setSelectedLabelIds((prev) =>
      prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id],
    );
  }

  function toggleGoal(id: string) {
    setSelectedGoalIds((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id],
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!task || !title.trim()) return;

    const ok = await onSubmit(task.id, {
      title: title.trim(),
      notes: notes.trim() || null,
      priority,
      status,
      dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      labelIds: selectedLabelIds,
      goalIds: selectedGoalIds,
      delegatedTo: delegatedTo.trim() || null,
      delegateNotes: delegateNotes.trim() || null,
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
            <Label htmlFor="edit-task-title">
              {tCommon("fields.title")}
              <span aria-hidden="true" className="ml-0.5 text-destructive">
                *
              </span>
            </Label>
            <Input
              id="edit-task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("fields.titlePlaceholder")}
              required
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-task-notes">
              {t("fields.notes")}
              <span className="ml-1 text-xs font-normal text-muted-foreground">
                ({tCommon("fields.optional")})
              </span>
            </Label>
            <Textarea
              id="edit-task-notes"
              value={notes}
              onChange={(e) => {
                if (e.target.value.length <= 250) setNotes(e.target.value);
              }}
              placeholder={t("fields.notesPlaceholder")}
              rows={3}
              className="resize-none"
              maxLength={250}
            />
            <p
              className={cn(
                "text-right text-xs",
                notes.length >= 230
                  ? "text-destructive"
                  : "text-muted-foreground",
              )}
            >
              {notes.length}/250
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-task-priority">
                {t("fields.priority")}
                <span className="ml-1 text-xs font-normal text-muted-foreground">
                  ({tCommon("fields.optional")})
                </span>
              </Label>
              <Select
                value={priority}
                onValueChange={(v) => v !== null && setPriority(v)}
              >
                <SelectTrigger
                  id="edit-task-priority"
                  className="w-full cursor-pointer"
                  aria-label={t("fields.priority")}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">{t("priority.low")}</SelectItem>
                  <SelectItem value="normal">{t("priority.normal")}</SelectItem>
                  <SelectItem value="high">{t("priority.high")}</SelectItem>
                  <SelectItem value="urgent">{t("priority.urgent")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-task-status">{tCommon("fields.status")}</Label>
              <Select
                value={status}
                onValueChange={(v) => v !== null && setStatus(v)}
              >
                <SelectTrigger
                  id="edit-task-status"
                  className="w-full cursor-pointer"
                  aria-label={tCommon("fields.status")}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">{tCommon("status.open")}</SelectItem>
                  <SelectItem value="in_progress">
                    {t("status.inProgress")}
                  </SelectItem>
                  <SelectItem value="done">{tCommon("status.done")}</SelectItem>
                  <SelectItem value="cancelled">
                    {tCommon("status.cancelled")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-task-due">
              {t("fields.dueDate")}
              <span className="ml-1 text-xs font-normal text-muted-foreground">
                ({tCommon("fields.optional")})
              </span>
            </Label>
            <DatePicker
              value={dueDate}
              onChange={setDueDate}
              placeholder={t("fields.dueDate")}
            />
          </div>

          {availableLabels.length > 0 && (
            <div className="space-y-1.5">
              <Label>
                {tCommon("entities.labels")}
                <span className="ml-1 text-xs font-normal text-muted-foreground">
                  ({tCommon("fields.optional")})
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

          {availableGoals.length > 0 && (
            <div className="space-y-1.5">
              <Label>
                {t("fields.linkedGoals")}
                <span className="ml-1 text-xs font-normal text-muted-foreground">
                  ({tCommon("fields.optional")})
                </span>
              </Label>
              <div className="max-h-36 overflow-y-auto space-y-0.5 rounded-md border border-border/60 p-2">
                {availableGoals.map((goal) => (
                  <label
                    key={goal.id}
                    className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 text-sm hover:bg-muted/60 transition-colors"
                  >
                    <Checkbox
                      checked={selectedGoalIds.includes(goal.id)}
                      onCheckedChange={() => toggleGoal(goal.id)}
                      aria-label={goal.title}
                    />
                    <span className="flex-1 truncate">{goal.title}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="edit-task-delegated-to">
              {t("fields.delegatedTo")}
              <span className="ml-1 text-xs font-normal text-muted-foreground">
                ({tCommon("fields.optional")})
              </span>
            </Label>
            <Input
              id="edit-task-delegated-to"
              value={delegatedTo}
              onChange={(e) => {
                if (e.target.value.length <= 150)
                  setDelegatedTo(e.target.value);
              }}
              placeholder={t("fields.delegatedToPlaceholder")}
              maxLength={150}
            />
          </div>

          {delegatedTo.trim() && (
            <div className="space-y-1.5">
              <Label htmlFor="edit-task-delegate-notes">
                {t("fields.delegateNotes")}
                <span className="ml-1 text-xs font-normal text-muted-foreground">
                  ({tCommon("fields.optional")})
                </span>
              </Label>
              <Textarea
                id="edit-task-delegate-notes"
                value={delegateNotes}
                onChange={(e) => {
                  if (e.target.value.length <= 250)
                    setDelegateNotes(e.target.value);
                }}
                placeholder={t("fields.delegateNotesPlaceholder")}
                rows={2}
                className="resize-none"
                maxLength={250}
              />
            </div>
          )}

          <DialogFooter>
            <Button
              type="submit"
              disabled={updating || !title.trim()}
              className="cursor-pointer"
            >
              {updating ? tCommon("states.saving") : tCommon("actions.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

