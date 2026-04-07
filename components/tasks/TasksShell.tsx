/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

"use client";

import { useState, useTransition } from "react";
import { Plus, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { TaskCard } from "./TaskCard";
import { CreateTaskDialog } from "./CreateTaskDialog";
import { EditTaskDialog } from "./EditTaskDialog";
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
import { useTaskMutations } from "./logic/useTaskMutations";
import type { LabelOptionRecord, TaskRecord } from "@/types/api";

type Filter = "all" | "open" | "in_progress" | "done" | "cancelled";

type TasksShellProps = {
  initialTasks: TaskRecord[];
  availableLabels: LabelOptionRecord[];
  availableGoals: { id: string; title: string }[];
};

export function TasksShell({
  initialTasks,
  availableLabels,
  availableGoals,
}: TasksShellProps) {
  const t = useTranslations("tasks");
  const [tasks, setTasks] = useState<TaskRecord[]>(initialTasks);
  const [filter, setFilter] = useState<Filter>("all");
  const [editTask, setEditTask] = useState<TaskRecord | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [isPendingRefresh, startRefresh] = useTransition();

  function handleRefresh() {
    startRefresh(async () => {
      const res = await fetch("/api/tasks");
      if (res.ok) {
        const { tasks: updated } = (await res.json()) as {
          tasks: TaskRecord[];
        };
        setTasks(updated);
      }
    });
  }

  const {
    creating,
    updating,
    deleting,
    createTask,
    updateTask,
    toggleDone,
    deleteTask,
  } = useTaskMutations(setTasks, {
    createSuccess: t("createDialog.success"),
    createError: t("createDialog.error"),
    updateSuccess: t("editDialog.success"),
    updateError: t("editDialog.error"),
    deleteSuccess: t("deleteDialog.success"),
    deleteError: t("deleteDialog.error"),
    completeSuccess: t("complete.success"),
    reopenSuccess: t("complete.reopen"),
    completeError: t("complete.error"),
  });

  const FILTERS: { key: Filter; label: string }[] = [
    { key: "all", label: t("filter.all") },
    { key: "open", label: t("filter.open") },
    { key: "in_progress", label: t("filter.inProgress") },
    { key: "done", label: t("filter.done") },
    { key: "cancelled", label: t("filter.cancelled") },
  ];

  const visible =
    filter === "all" ? tasks : tasks.filter((t) => t.status === filter);

  function handleEdit(task: TaskRecord) {
    setEditTask(task);
    setEditOpen(true);
  }

  function handleDeleteRequest(taskId: string) {
    setDeleteTarget(taskId);
    setDeleteOpen(true);
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    await deleteTask(deleteTarget);
    setDeleteOpen(false);
    setDeleteTarget(null);
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("pageTitle")}
        </h1>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isPendingRefresh}
            onClick={handleRefresh}
            aria-label={t("refresh")}
            className="cursor-pointer"
          >
            <RefreshCw
              className={`size-3.5 ${isPendingRefresh ? "animate-spin" : ""}`}
            />
            {isPendingRefresh ? t("refreshing") : t("refresh")}
          </Button>
          <CreateTaskDialog
            onSubmit={createTask}
            creating={creating}
            availableLabels={availableLabels}
            availableGoals={availableGoals}
          >
            <Button
              type="button"
              size="sm"
              className="cursor-pointer"
              aria-label={t("newTask")}
            >
              <Plus className="size-4" />
              {t("newTask")}
            </Button>
          </CreateTaskDialog>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="mb-4 flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <Button
            key={f.key}
            type="button"
            variant={filter === f.key ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f.key)}
            className="cursor-pointer rounded-full px-3 text-xs"
          >
            {f.label}
            {f.key === "all"
              ? ` (${tasks.length})`
              : ` (${tasks.filter((t) => t.status === f.key).length})`}
          </Button>
        ))}
      </div>

      {/* Task list */}
      {visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 px-6 py-16 text-center">
          <p className="text-sm text-muted-foreground">
            {filter === "all" ? t("empty") : t("emptyFiltered")}
          </p>
          {filter === "all" && (
            <CreateTaskDialog
              onSubmit={createTask}
              creating={creating}
              availableLabels={availableLabels}
              availableGoals={availableGoals}
            >
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-4 cursor-pointer"
              >
                <Plus className="size-4" />
                {t("newTask")}
              </Button>
            </CreateTaskDialog>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {visible.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              isUpdating={updating === task.id}
              isDeleting={deleting === task.id}
              onToggleDone={toggleDone}
              onEdit={handleEdit}
              onDelete={handleDeleteRequest}
            />
          ))}
        </div>
      )}

      {/* Edit dialog */}
      <EditTaskDialog
        key={editTask?.id ?? "edit-task"}
        task={editTask}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSubmit={updateTask}
        updating={!!updating}
        availableLabels={availableLabels}
        availableGoals={availableGoals}
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
