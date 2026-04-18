/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version beta
 * @since beta
 * @module
 * @description
 */

"use client";

import { useState, useTransition } from "react";
import { Pencil, Trash2, Plus, Tag, RefreshCw, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  LABEL_ICON_MAP,
  LABEL_ICON_NAMES,
} from "@/components/labels/label-icons";
import type { LabelIconName } from "@/components/labels/label-icons";
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

// ─── Icon Picker ───────────────────────────────────────────────────────────

function IconPicker({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (icon: string | null) => void;
}) {
  const t = useTranslations("labels");
  return (
    <div className="flex flex-wrap gap-1.5">
      <button
        type="button"
        aria-label={t("fields.iconNone")}
        onClick={() => onChange(null)}
        className={cn(
          "size-7 cursor-pointer rounded-md border-2 flex items-center justify-center transition-colors",
          value === null
            ? "border-foreground bg-muted"
            : "border-transparent bg-muted/40 hover:bg-muted",
        )}
      >
        <X className="size-3.5 text-muted-foreground" />
      </button>
      {LABEL_ICON_NAMES.map((iconName) => {
        const Icon = LABEL_ICON_MAP[iconName as LabelIconName];
        return (
          <button
            key={iconName}
            type="button"
            aria-label={iconName}
            onClick={() => onChange(iconName)}
            className={cn(
              "size-7 cursor-pointer rounded-md border-2 flex items-center justify-center transition-colors",
              value === iconName
                ? "border-foreground bg-muted"
                : "border-transparent bg-muted/40 hover:bg-muted",
            )}
          >
            <Icon className="size-3.5" />
          </button>
        );
      })}
    </div>
  );
}

// ─── Props ─────────────────────────────────────────────────────────────────

type LabelsShellProps = {
  initialLabels: LabelRecord[];
};

// ─── Component ─────────────────────────────────────────────────────────────

export function LabelsShell({ initialLabels }: LabelsShellProps) {
  const t = useTranslations("labels");

  const [labels, setLabels] = useState<LabelRecord[]>(initialLabels);

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createColor, setCreateColor] = useState<string>(PRESET_COLORS[0]);
  const [createIcon, setCreateIcon] = useState<string | null>(null);
  const [isPendingCreate, startCreate] = useTransition();

  // Edit dialog
  const [editingLabel, setEditingLabel] = useState<LabelRecord | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState<string>(PRESET_COLORS[0]);
  const [editIcon, setEditIcon] = useState<string | null>(null);
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
    setCreateIcon(null);
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
        body: JSON.stringify({ name, color: createColor, icon: createIcon }),
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
    setEditIcon(label.icon ?? null);
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
        body: JSON.stringify({ name, color: editColor, icon: editIcon }),
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
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      {/* Page header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("pageTitle")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("pageSubtitle")}
          </p>
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
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-16 text-center text-sm text-muted-foreground">
          <Tag className="size-6 opacity-40" />
          <span>{t("empty")}</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={openCreate}
            className="mt-2 cursor-pointer"
          >
            <Plus className="size-4" />
            {t("newLabel")}
          </Button>
        </div>
      ) : (
        <div className="divide-y divide-border/60 rounded-lg border">
          {labels.map((label) => {
            const Icon = label.icon
              ? LABEL_ICON_MAP[label.icon as LabelIconName]
              : null;
            return (
              <div
                key={label.id}
                className="flex items-center justify-between gap-3 px-4 py-3"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <span
                    className="size-3 shrink-0 rounded-full"
                    style={{ backgroundColor: label.color }}
                  />
                  {Icon && (
                    <Icon className="size-4 shrink-0 text-muted-foreground" />
                  )}
                  <span className="truncate text-sm font-medium">
                    {label.name}
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-0.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 cursor-pointer"
                    aria-label={t("editLabel")}
                    onClick={() => openEdit(label)}
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 cursor-pointer text-destructive hover:text-destructive"
                    aria-label={t("deleteLabel")}
                    onClick={() => setDeletingLabel(label)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
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
            <div className="space-y-1.5">
              <Label>{t("fields.icon")}</Label>
              <IconPicker value={createIcon} onChange={setCreateIcon} />
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
            <div className="space-y-1.5">
              <Label>{t("fields.icon")}</Label>
              <IconPicker value={editIcon} onChange={setEditIcon} />
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
