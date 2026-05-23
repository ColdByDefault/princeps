/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version canary-v1.1.4
 */

"use client";

import { useState, useTransition } from "react";
import { BookOpen, Plus, RefreshCw } from "lucide-react";
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
    { key: "all", label: t("filter.all") },
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
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-xl font-semibold">{t("pageTitle")}</h1>
          <span className="text-sm text-muted-foreground">
            ({items.filter((i) => i.status === "unread").length})
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            disabled={isPendingRefresh}
            aria-label={t("refresh")}
            className="cursor-pointer"
          >
            <RefreshCw
              className={`h-4 w-4 ${isPendingRefresh ? "animate-spin" : ""}`}
            />
          </Button>
          <Button
            onClick={() => setAddOpen(true)}
            disabled={adding}
            className="cursor-pointer gap-1.5"
          >
            <Plus className="h-4 w-4" />
            {t("addItem")}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map(({ key, label }) => (
          <Button
            key={key}
            variant={filter === key ? "secondary" : "outline"}
            size="sm"
            onClick={() => setFilter(key)}
            className="cursor-pointer"
          >
            {label}
          </Button>
        ))}
      </div>

      {/* Items */}
      {visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-16 text-center text-muted-foreground">
          <BookOpen className="h-10 w-10 opacity-30" />
          <p className="text-sm">
            {filter === "all" ? t("empty") : t("emptyFiltered")}
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
              {t("deleteDialog.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">
              {t("deleteDialog.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="cursor-pointer bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("deleteDialog.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
