/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version canary-v1.1.8
 * @since canary-v1.0.2
 */

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
import { MemoryEntryDetailDialog } from "./MemoryEntryDetailDialog";
import { EditMemoryEntryDialog } from "./EditMemoryEntryDialog";
import { useMemoryMutations } from "./logic/useMemoryMutations";
import type { MemoryEntryRecord } from "@/types/api";

type MemoryShellProps = {
  initialEntries: MemoryEntryRecord[];
};

export function MemoryShell({ initialEntries }: MemoryShellProps) {
  const t = useTranslations("memory");
  const tCommon = useTranslations("common");
  const [entries, setEntries] = useState<MemoryEntryRecord[]>(initialEntries);
  const [detailEntry, setDetailEntry] = useState<MemoryEntryRecord | null>(
    null,
  );
  const [detailOpen, setDetailOpen] = useState(false);
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

  function handleDetail(entry: MemoryEntryRecord) {
    setDetailEntry(entry);
    setDetailOpen(true);
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    await deleteEntry(deleteTarget);
    setDeleteOpen(false);
    setDeleteTarget(null);
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">
          {tCommon("entities.memory")}
        </h1>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isPendingRefresh}
            onClick={handleRefresh}
            aria-label={tCommon("actions.refresh")}
            className="cursor-pointer"
          >
            <RefreshCw
              className={`size-3.5 ${isPendingRefresh ? "animate-spin" : ""}`}
            />
            {isPendingRefresh
              ? tCommon("states.refreshing")
              : tCommon("actions.refresh")}
          </Button>
          <CreateMemoryEntryDialog onSubmit={createEntry} creating={creating}>
            <Button
              type="button"
              size="sm"
              className="cursor-pointer"
              aria-label={t("addEntry")}
            >
              <Plus className="size-4" />
              {t("addEntry")}
            </Button>
          </CreateMemoryEntryDialog>
        </div>
      </div>

      {/* List */}
      {entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 px-6 py-16 text-center">
          <p className="text-sm text-muted-foreground">{t("empty")}</p>
          <p className="mt-1 text-xs text-muted-foreground/70">
            {t("emptyHint")}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => (
            <MemoryEntryCard
              key={entry.id}
              entry={entry}
              isUpdating={updating === entry.id}
              isDeleting={deleting === entry.id}
              onView={handleDetail}
              onEdit={(e) => setEditEntry(e)}
              onDelete={handleDeleteRequest}
            />
          ))}
        </div>
      )}

      <MemoryEntryDetailDialog
        entry={
          detailEntry
            ? (entries.find((entry) => entry.id === detailEntry.id) ??
              detailEntry)
            : null
        }
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onEdit={(entry) => {
          setDetailOpen(false);
          setEditEntry(entry);
        }}
        onDelete={(id) => {
          setDetailOpen(false);
          handleDeleteRequest(id);
        }}
      />

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
              {tCommon("confirmation.cannotUndo")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">
              {tCommon("actions.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              className="cursor-pointer"
              onClick={handleDeleteConfirm}
              disabled={!!deleting}
            >
              {tCommon("actions.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
