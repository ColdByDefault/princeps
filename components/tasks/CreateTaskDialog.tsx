/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

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
import type { LabelOptionRecord } from "@/types/api";

type CreateTaskDialogProps = {
  onSubmit: (input: {
    title: string;
    notes?: string;
    priority?: string;
    dueDate?: string | null;
    labelIds?: string[];
  }) => Promise<boolean>;
  creating: boolean;
  availableLabels: LabelOptionRecord[];
  children: React.ReactNode;
};

export function CreateTaskDialog({
  onSubmit,
  creating,
  availableLabels,
  children,
}: CreateTaskDialogProps) {
  const t = useTranslations("tasks");
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [priority, setPriority] = useState("normal");
  const [dueDate, setDueDate] = useState("");
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
      ...(notes.trim() && { notes: notes.trim() }),
      priority,
      dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      ...(selectedLabelIds.length && { labelIds: selectedLabelIds }),
    });

    if (ok) {
      setOpen(false);
      setTitle("");
      setNotes("");
      setPriority("normal");
      setDueDate("");
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
            <Label htmlFor="task-title">
              {t("fields.title")}
              <span aria-hidden="true" className="ml-0.5 text-destructive">
                *
              </span>
            </Label>
            <Input
              id="task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("fields.titlePlaceholder")}
              required
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="task-notes">
              {t("fields.notes")}
              <span className="ml-1 text-xs font-normal text-muted-foreground">
                ({t("fields.optional")})
              </span>
            </Label>
            <Textarea
              id="task-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t("fields.notesPlaceholder")}
              rows={3}
              className="resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="task-priority">
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
                  id="task-priority"
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
              <Label htmlFor="task-due">
                {t("fields.dueDate")}
                <span className="ml-1 text-xs font-normal text-muted-foreground">
                  ({t("fields.optional")})
                </span>
              </Label>
              <Input
                id="task-due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="cursor-pointer"
                placeholder={t("fields.dueDate")}
              />
            </div>
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
