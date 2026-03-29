/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getMessage } from "@/lib/i18n";
import type { TaskRecord } from "@/types/api";
import type { MessageDictionary } from "@/types/i18n";

interface TaskFormProps {
  messages: MessageDictionary;
  open: boolean;
  initial: TaskRecord | null;
  onClose: () => void;
  onSaved: (task: TaskRecord) => void;
}

function toDateInputValue(iso: string | null | undefined): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

export function TaskForm({
  messages,
  open,
  initial,
  onClose,
  onSaved,
}: TaskFormProps) {
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("open");
  const [priority, setPriority] = useState("normal");
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setTitle(initial?.title ?? "");
      setNotes(initial?.notes ?? "");
      setStatus(initial?.status ?? "open");
      setPriority(initial?.priority ?? "normal");
      setDueDate(toDateInputValue(initial?.dueDate));
      setError(null);
    }
  }, [open, initial]);

  async function handleSave() {
    if (!title.trim()) return;
    setError(null);
    setSaving(true);

    const payload = {
      title: title.trim(),
      notes: notes.trim() || null,
      status,
      priority,
      dueDate: dueDate ? new Date(dueDate).toISOString() : null,
    };

    try {
      const url = initial ? `/api/tasks/${initial.id}` : "/api/tasks";
      const method = initial ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Failed to save.");
      }

      const data = (await res.json()) as { task: TaskRecord };
      onSaved(data.task);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : getMessage(
              messages,
              "tasks.saveError",
              "Failed to save task. Please try again.",
            ),
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {initial
              ? initial.title
              : getMessage(messages, "tasks.add", "Add task")}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-3">
          {/* Title */}
          <div className="grid gap-1.5">
            <Label htmlFor="task-title">
              {getMessage(messages, "tasks.field.title", "Title")}
            </Label>
            <Input
              id="task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={getMessage(
                messages,
                "tasks.field.title.placeholder",
                "Follow up with investor",
              )}
            />
          </div>

          {/* Status + Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="task-status">
                {getMessage(messages, "tasks.field.status", "Status")}
              </Label>
              <Select
                value={status}
                onValueChange={(v) => {
                  if (v) setStatus(v);
                }}
              >
                <SelectTrigger id="task-status" className="cursor-pointer">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(["open", "in_progress", "done", "cancelled"] as const).map(
                    (s) => (
                      <SelectItem key={s} value={s} className="cursor-pointer">
                        {getMessage(
                          messages,
                          `tasks.status.${s}` as Parameters<
                            typeof getMessage
                          >[1],
                          s,
                        )}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="task-priority">
                {getMessage(messages, "tasks.field.priority", "Priority")}
              </Label>
              <Select
                value={priority}
                onValueChange={(v) => {
                  if (v) setPriority(v);
                }}
              >
                <SelectTrigger id="task-priority" className="cursor-pointer">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(["urgent", "high", "normal", "low"] as const).map((p) => (
                    <SelectItem key={p} value={p} className="cursor-pointer">
                      {getMessage(
                        messages,
                        `tasks.priority.${p}` as Parameters<
                          typeof getMessage
                        >[1],
                        p,
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Due date */}
          <div className="grid gap-1.5">
            <Label htmlFor="task-due-date">
              {getMessage(messages, "tasks.field.dueDate", "Due date")}
            </Label>
            <Input
              id="task-due-date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          {/* Notes */}
          <div className="grid gap-1.5">
            <Label htmlFor="task-notes">
              {getMessage(messages, "tasks.field.notes", "Notes")}
            </Label>
            <Textarea
              id="task-notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={getMessage(
                messages,
                "tasks.field.notes.placeholder",
                "Additional context\u2026",
              )}
            />
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            {getMessage(messages, "tasks.cancel", "Cancel")}
          </Button>
          <Button
            onClick={() => void handleSave()}
            disabled={saving || !title.trim()}
          >
            {saving
              ? getMessage(messages, "tasks.saving", "Saving\u2026")
              : getMessage(messages, "tasks.save", "Save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
