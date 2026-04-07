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
import { GoalCard } from "./GoalCard";
import { CreateGoalDialog } from "./CreateGoalDialog";
import { EditGoalDialog } from "./EditGoalDialog";
import { useGoalMutations } from "./logic/useGoalMutations";
import type { GoalRecord, LabelOptionRecord } from "@/types/api";

type Filter = "all" | "open" | "in_progress" | "done" | "cancelled";

type GoalsShellProps = {
  initialGoals: GoalRecord[];
  availableLabels: LabelOptionRecord[];
  availableTasks: { id: string; title: string; status: string }[];
};

export function GoalsShell({
  initialGoals,
  availableLabels,
  availableTasks,
}: GoalsShellProps) {
  const t = useTranslations("goals");
  const [goals, setGoals] = useState<GoalRecord[]>(initialGoals);
  const [filter, setFilter] = useState<Filter>("all");
  const [editGoal, setEditGoal] = useState<GoalRecord | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [isPendingRefresh, startRefresh] = useTransition();

  function handleRefresh() {
    startRefresh(async () => {
      const res = await fetch("/api/goals");
      if (res.ok) {
        const { goals: updated } = (await res.json()) as {
          goals: GoalRecord[];
        };
        setGoals(updated);
      }
    });
  }

  const {
    creating,
    updating,
    deleting,
    milestonePending,
    createGoal,
    updateGoal,
    deleteGoal,
    addMilestone,
    toggleMilestone,
    deleteMilestone,
  } = useGoalMutations(setGoals, {
    createSuccess: t("createDialog.success"),
    createError: t("createDialog.error"),
    updateSuccess: t("editDialog.success"),
    updateError: t("editDialog.error"),
    deleteSuccess: t("deleteDialog.success"),
    deleteError: t("deleteDialog.error"),
  });

  const FILTERS: { key: Filter; label: string }[] = [
    { key: "all", label: t("filter.all") },
    { key: "open", label: t("filter.open") },
    { key: "in_progress", label: t("filter.in_progress") },
    { key: "done", label: t("filter.done") },
    { key: "cancelled", label: t("filter.cancelled") },
  ];

  const visible =
    filter === "all" ? goals : goals.filter((g) => g.status === filter);

  function handleEdit(goal: GoalRecord) {
    setEditGoal(goal);
    setEditOpen(true);
  }

  function handleDeleteRequest(goalId: string) {
    setDeleteTarget(goalId);
    setDeleteOpen(true);
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    await deleteGoal(deleteTarget);
    setDeleteOpen(false);
    setDeleteTarget(null);
  }

  // Sync editGoal with latest data from state when dialog is open
  const editGoalLive = editGoal
    ? (goals.find((g) => g.id === editGoal.id) ?? editGoal)
    : null;

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
          <CreateGoalDialog
            onSubmit={createGoal}
            creating={creating}
            availableLabels={availableLabels}
          >
            <Button
              type="button"
              size="sm"
              className="cursor-pointer"
              aria-label={t("newGoal")}
            >
              <Plus className="size-4" />
              {t("newGoal")}
            </Button>
          </CreateGoalDialog>
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
              ? ` (${goals.length})`
              : ` (${goals.filter((g) => g.status === f.key).length})`}
          </Button>
        ))}
      </div>

      {/* List / empty state */}
      {visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 px-6 py-16 text-center">
          <p className="text-sm text-muted-foreground">
            {filter === "all" ? t("empty") : t("emptyFiltered")}
          </p>
          {filter === "all" && (
            <CreateGoalDialog
              onSubmit={createGoal}
              creating={creating}
              availableLabels={availableLabels}
            >
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-4 cursor-pointer"
              >
                <Plus className="size-4" />
                {t("newGoal")}
              </Button>
            </CreateGoalDialog>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {visible.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              isUpdating={updating === goal.id}
              isDeleting={deleting === goal.id}
              onEdit={handleEdit}
              onDelete={handleDeleteRequest}
            />
          ))}
        </div>
      )}

      {/* Edit dialog */}
      {editGoalLive && (
        <EditGoalDialog
          key={editGoal?.id ?? "edit"}
          goal={editGoalLive}
          open={editOpen}
          onOpenChange={setEditOpen}
          onUpdate={updateGoal}
          onAddMilestone={addMilestone}
          onToggleMilestone={toggleMilestone}
          onDeleteMilestone={deleteMilestone}
          updating={updating}
          milestonePending={milestonePending}
          availableLabels={availableLabels}
          availableTasks={availableTasks}
        />
      )}

      {/* Delete confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteDialog.heading")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteDialog.body")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">
              {t("deleteDialog.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="cursor-pointer bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
