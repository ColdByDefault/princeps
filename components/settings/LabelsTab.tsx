/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

"use client";

import { useState, useTransition } from "react";
import { Pencil, Trash2, Plus, Tag, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { LabelRecord } from "@/types/api";

// ─── Preset colors ─────────────────────────────────────────────────────────

const PRESET_COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#a855f7",
  "#ec4899",
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#14b8a6",
  "#3b82f6",
  "#06b6d4",
  "#64748b",
] as const;

// ─── Color Picker ──────────────────────────────────────────────────────────

function ColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (color: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {PRESET_COLORS.map((color) => (
        <button
          key={color}
          type="button"
          aria-label={color}
          onClick={() => onChange(color)}
          className={cn(
            "size-6 rounded-full border-2 cursor-pointer transition-transform hover:scale-110",
            value === color
              ? "border-foreground scale-110"
              : "border-transparent",
          )}
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  );
}

// ─── Props ─────────────────────────────────────────────────────────────────

type LabelsTabProps = {
  initialLabels: LabelRecord[];
};

// ─── Component ─────────────────────────────────────────────────────────────

export function LabelsTab({ initialLabels }: LabelsTabProps) {
  const t = useTranslations("labels");

  const [labels, setLabels] = useState<LabelRecord[]>(initialLabels);

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createColor, setCreateColor] = useState<string>(PRESET_COLORS[0]);
  const [isPendingCreate, startCreate] = useTransition();

  // Edit dialog
  const [editingLabel, setEditingLabel] = useState<LabelRecord | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState<string>(PRESET_COLORS[0]);
  const [isPendingEdit, startEdit] = useTransition();

  // Delete dialog
  const [deletingLabel, setDeletingLabel] = useState<LabelRecord | null>(null);
  const [isPendingDelete, startDelete] = useTransition();

  // Refresh
  const [isPendingRefresh, startRefresh] = useTransition();

  function handleRefresh() {
    startRefresh(async () => {
      const res = await fetch("/api/labels");
      if (res.ok) {
        const { labels: updated } = (await res.json()) as {
          labels: LabelRecord[];
        };
        setLabels(updated);
      }
    });
  }

  // ── Create ────────────────────────────────────────────────────────────────

  function openCreate() {
    setCreateName("");
    setCreateColor(PRESET_COLORS[0]);
    setCreateOpen(true);
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const name = createName.trim();
    if (!name) return;

    startCreate(async () => {
      const res = await fetch("/api/labels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, color: createColor }),
      });

      if (res.status === 409) {
        toast.error(t("createDialog.duplicateError"));
        return;
      }
      if (!res.ok) {
        toast.error(t("createDialog.error"));
        return;
      }

      const { label } = (await res.json()) as { label: LabelRecord };
      setLabels((prev) => [...prev, label]);
      setCreateOpen(false);
      toast.success(t("createDialog.success"));
    });
  }

  // ── Edit ──────────────────────────────────────────────────────────────────

  function openEdit(label: LabelRecord) {
    setEditingLabel(label);
    setEditName(label.name);
    setEditColor(label.color);
  }

  function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingLabel) return;
    const name = editName.trim();
    if (!name) return;

    startEdit(async () => {
      const res = await fetch(`/api/labels/${editingLabel.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, color: editColor }),
      });

      if (res.status === 409) {
        toast.error(t("editDialog.duplicateError"));
        return;
      }
      if (!res.ok) {
        toast.error(t("editDialog.error"));
        return;
      }

      const { label } = (await res.json()) as { label: LabelRecord };
      setLabels((prev) => prev.map((l) => (l.id === label.id ? label : l)));
      setEditingLabel(null);
      toast.success(t("editDialog.success"));
    });
  }

  // ── Delete ────────────────────────────────────────────────────────────────

  function handleDelete() {
    if (!deletingLabel) return;
    const id = deletingLabel.id;

    startDelete(async () => {
      const res = await fetch(`/api/labels/${id}`, { method: "DELETE" });

      if (!res.ok) {
        toast.error(t("deleteDialog.error"));
        return;
      }

      setLabels((prev) => prev.filter((l) => l.id !== id));
      setDeletingLabel(null);
      toast.success(t("deleteDialog.success"));
    });
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-0.5">
          <p className="text-sm font-medium">{t("title")}</p>
          <p className="text-sm text-muted-foreground">{t("description")}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="cursor-pointer rounded-full border-border/70"
            disabled={isPendingRefresh}
            onClick={handleRefresh}
            aria-label={t("refresh")}
          >
            <RefreshCw
              className={`size-3.5 ${isPendingRefresh ? "animate-spin" : ""}`}
            />
            {isPendingRefresh ? t("refreshing") : t("refresh")}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="cursor-pointer shrink-0 rounded-full border-border/70"
            onClick={openCreate}
            aria-label={t("newLabel")}
          >
            <Plus className="size-3.5" />
            {t("newLabel")}
          </Button>
        </div>
      </div>

      {/* Labels list */}
      {labels.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
          <Tag className="size-5 opacity-40" />
          <span>{t("empty")}</span>
        </div>
      ) : (
        <div className="divide-y divide-border/60 rounded-lg border">
          {labels.map((label) => (
            <div
              key={label.id}
              className="flex items-center justify-between gap-3 px-3 py-2.5"
            >
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className="size-3 shrink-0 rounded-full"
                  style={{ backgroundColor: label.color }}
                />
                <span className="truncate text-sm font-medium">
                  {label.name}
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-0.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-7 cursor-pointer"
                  aria-label={t("editLabel")}
                  onClick={() => openEdit(label)}
                >
                  <Pencil className="size-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-7 cursor-pointer text-destructive hover:text-destructive"
                  aria-label={t("deleteLabel")}
                  onClick={() => setDeletingLabel(label)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Create dialog ───────────────────────────────────────────────── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("createDialog.heading")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="label-create-name">{t("fields.name")}</Label>
              <Input
                id="label-create-name"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder={t("fields.namePlaceholder")}
                required
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("fields.color")}</Label>
              <ColorPicker value={createColor} onChange={setCreateColor} />
            </div>
            <DialogFooter>
              <Button
                type="submit"
                disabled={isPendingCreate || !createName.trim()}
                className="cursor-pointer"
              >
                {isPendingCreate
                  ? t("createDialog.submitting")
                  : t("createDialog.submit")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Edit dialog ─────────────────────────────────────────────────── */}
      <Dialog
        open={editingLabel !== null}
        onOpenChange={(open) => {
          if (!open) setEditingLabel(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("editDialog.heading")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="label-edit-name">{t("fields.name")}</Label>
              <Input
                id="label-edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder={t("fields.namePlaceholder")}
                required
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("fields.color")}</Label>
              <ColorPicker value={editColor} onChange={setEditColor} />
            </div>
            <DialogFooter>
              <Button
                type="submit"
                disabled={isPendingEdit || !editName.trim()}
                className="cursor-pointer"
              >
                {isPendingEdit
                  ? t("editDialog.submitting")
                  : t("editDialog.submit")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Delete confirm ──────────────────────────────────────────────── */}
      <AlertDialog
        open={deletingLabel !== null}
        onOpenChange={(open) => {
          if (!open) setDeletingLabel(null);
        }}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteDialog.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteDialog.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">
              {t("deleteDialog.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isPendingDelete}
              className="cursor-pointer"
            >
              {t("deleteDialog.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
