/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version canary-v1.1.9
 * @since canary-v1.1.4
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
import { ReadingItemCard } from "./ReadingItemCard";
import { AddReadingItemDialog } from "./AddReadingItemDialog";
import { useReadingQueueMutations } from "./logic/useReadingQueueMutations";
import type { ReadingItemRecord } from "@/types/api";

type StatusFilter = "all" | "unread" | "read" | "archived";

type ReadingQueueShellProps = {
  initialItems: ReadingItemRecord[];
};

export function ReadingQueueShell({ initialItems }: ReadingQueueShellProps) {
  const t = useTranslations("readingQueue");
  const tCommon = useTranslations("common");
  const [items, setItems] = useState<ReadingItemRecord[]>(initialItems);
  const [filter, setFilter] = useState<StatusFilter>("unread");
  const [addOpen, setAddOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [isPendingRefresh, startRefresh] = useTransition();

  function handleRefresh() {
    startRefresh(async () => {
      const res = await fetch("/api/reading-queue");
      if (res.ok) {
        const { items: updated } = (await res.json()) as {
          items: ReadingItemRecord[];
        };
        setItems(updated);
      }
    });
  }

  const {
    adding,
    updatingId,
    deletingId,
    addItem,
    markRead,
    archive,
    deleteItem,
  } = useReadingQueueMutations(setItems, {
    addSuccess: t("addDialog.success"),
    addError: t("addDialog.error"),
    markReadSuccess: t("status.markReadSuccess"),
    markReadError: t("status.markReadError"),
    archiveSuccess: t("status.archiveSuccess"),
    archiveError: t("status.archiveError"),
    deleteSuccess: t("deleteDialog.success"),
    deleteError: t("deleteDialog.error"),
  });

  const FILTERS: { key: StatusFilter; label: string }[] = [
    { key: "all", label: tCommon("filters.all") },
    { key: "unread", label: t("filter.unread") },
    { key: "read", label: t("filter.read") },
    { key: "archived", label: t("filter.archived") },
  ];

  const visible =
    filter === "all" ? items : items.filter((i) => i.status === filter);

  function handleDeleteClick(id: string) {
    setDeleteTarget(id);
    setDeleteOpen(true);
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) return;
    deleteItem(deleteTarget);
    setDeleteOpen(false);
    setDeleteTarget(null);
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">
          {tCommon("entities.readingQueue")}
        </h1>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isPendingRefresh}
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
          <Button
            type="button"
            size="sm"
            onClick={() => setAddOpen(true)}
            disabled={adding}
            className="cursor-pointer"
            aria-label={t("addItem")}
          >
            <Plus className="size-4" />
            {t("addItem")}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-1.5">
        {FILTERS.map(({ key, label }) => (
          <Button
            key={key}
            type="button"
            variant={filter === key ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(key)}
            className="cursor-pointer rounded-full px-3 text-xs"
          >
            {label}
            {key === "all"
              ? ` (${items.length})`
              : ` (${items.filter((i) => i.status === key).length})`}
          </Button>
        ))}
      </div>

      {/* Items */}
      {visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 px-6 py-16 text-center">
          <p className="text-sm text-muted-foreground">
            {filter === "all" ? t("empty") : t("emptyFiltered")}
          </p>
          {filter === "all" && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setAddOpen(true)}
              className="mt-4 cursor-pointer"
            >
              <Plus className="size-4" />
              {t("addItem")}
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {visible.map((item) => (
            <ReadingItemCard
              key={item.id}
              item={item}
              onMarkRead={() => markRead(item.id)}
              onArchive={() => archive(item.id)}
              onDelete={() => handleDeleteClick(item.id)}
              isUpdating={updatingId === item.id}
              isDeleting={deletingId === item.id}
            />
          ))}
        </div>
      )}

      {/* Add item dialog */}
      <AddReadingItemDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onAdd={addItem}
        isAdding={adding}
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
              onClick={handleDeleteConfirm}
              className="cursor-pointer bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {tCommon("actions.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
