"use client";

import { useState, useTransition } from "react";
import { Plus, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MemoryEntryCard } from "./MemoryEntryCard";
import { CreateMemoryEntryDialog } from "./CreateMemoryEntryDialog";
import { EditMemoryEntryDialog } from "./EditMemoryEntryDialog";
import { useMemoryMutations } from "./logic/useMemoryMutations";
import type { MemoryEntryRecord } from "@/types/api";

type MemoryShellProps = {
  initialEntries: MemoryEntryRecord[];
};

export function MemoryShell({ initialEntries }: MemoryShellProps) {
  const t = useTranslations("memory");
  const [entries, setEntries] = useState<MemoryEntryRecord[]>(initialEntries);
  const [editEntry, setEditEntry] = useState<MemoryEntryRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [isPendingRefresh, startRefresh] = useTransition();

  function handleRefresh() {
    startRefresh(async () => {
      const res = await fetch("/api/memory");
      if (res.ok) {
        const { entries: updated } = (await res.json()) as {
          entries: MemoryEntryRecord[];
        };
        setEntries(updated);
      }
    });
  }

  const {
    creating,
    updating,
    deleting,
    createEntry,
    updateEntry,
    deleteEntry,
  } = useMemoryMutations(setEntries, {
    createSuccess: t("createDialog.success"),
    createError: t("createDialog.error"),
    updateSuccess: t("editDialog.success"),
    updateError: t("editDialog.error"),
    deleteSuccess: t("deleteDialog.success"),
    deleteError: t("deleteDialog.error"),
  });

  function handleDeleteRequest(id: string) {
    setDeleteTarget(id);
    setDeleteOpen(true);
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    await deleteEntry(deleteTarget);
    setDeleteOpen(false);
    setDeleteTarget(null);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("pageTitle")}
          </h1>
          <p className="text-sm text-muted-foreground">{t("pageSubtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="cursor-pointer"
            onClick={handleRefresh}
            disabled={isPendingRefresh}
            aria-label={t("refresh")}
          >
            <RefreshCw
              className={isPendingRefresh ? "animate-spin size-4" : "size-4"}
            />
          </Button>
          <CreateMemoryEntryDialog onSubmit={createEntry} creating={creating}>
            <Button className="cursor-pointer gap-2">
              <Plus className="size-4" />
              {t("addEntry")}
            </Button>
          </CreateMemoryEntryDialog>
        </div>
      </div>

      {/* List */}
      {entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
          <p className="text-sm font-medium text-muted-foreground">
            {t("empty")}
          </p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            {t("emptyHint")}
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {entries.map((entry) => (
            <MemoryEntryCard
              key={entry.id}
              entry={entry}
              isUpdating={updating === entry.id}
              isDeleting={deleting === entry.id}
              onEdit={(e) => setEditEntry(e)}
              onDelete={handleDeleteRequest}
            />
          ))}
        </div>
      )}

      {/* Edit dialog */}
      <EditMemoryEntryDialog
        entry={editEntry}
        onClose={() => setEditEntry(null)}
        onSubmit={updateEntry}
        updating={updating}
      />

      {/* Delete confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteDialog.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteDialog.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">
              {t("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              className="cursor-pointer"
              onClick={handleDeleteConfirm}
              disabled={!!deleting}
            >
              {t("deleteDialog.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
