/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

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
import type { LabelOptionRecord, TaskRecord } from "@/types/api";

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
    }>,
  ) => Promise<boolean>;
  updating: boolean;
  availableLabels: LabelOptionRecord[];
};

export function EditTaskDialog({
  task,
  open,
  onOpenChange,
  onSubmit,
  updating,
  availableLabels,
}: EditTaskDialogProps) {
  const t = useTranslations("tasks");
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

  function toggleLabel(id: string) {
    setSelectedLabelIds((prev) =>
      prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id],
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
              {t("fields.title")}
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
                ({t("fields.optional")})
              </span>
            </Label>
            <Textarea
              id="edit-task-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t("fields.notesPlaceholder")}
              rows={3}
              className="resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-task-priority">
                {t("fields.priority")}
                <span className="ml-1 text-xs font-normal text-muted-foreground">
                  ({t("fields.optional")})
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
              <Label htmlFor="edit-task-status">{t("fields.status")}</Label>
              <Select
                value={status}
                onValueChange={(v) => v !== null && setStatus(v)}
              >
                <SelectTrigger
                  id="edit-task-status"
                  className="w-full cursor-pointer"
                  aria-label={t("fields.status")}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">{t("status.open")}</SelectItem>
                  <SelectItem value="in_progress">
                    {t("status.inProgress")}
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
            <Label htmlFor="edit-task-due">
              {t("fields.dueDate")}
              <span className="ml-1 text-xs font-normal text-muted-foreground">
                ({t("fields.optional")})
              </span>
            </Label>
            <Input
              id="edit-task-due"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="cursor-pointer"
              placeholder={t("fields.dueDate")}
            />
          </div>

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
