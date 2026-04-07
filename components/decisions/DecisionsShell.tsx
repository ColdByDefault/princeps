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
import { DecisionCard } from "./DecisionCard";
import { CreateDecisionDialog } from "./CreateDecisionDialog";
import { EditDecisionDialog } from "./EditDecisionDialog";
import { useDecisionMutations } from "./logic/useDecisionMutations";
import type {
  DecisionRecord,
  LabelOptionRecord,
  MeetingRecord,
} from "@/types/api";

type Filter = "all" | "open" | "decided" | "reversed";

type DecisionsShellProps = {
  initialDecisions: DecisionRecord[];
  availableLabels: LabelOptionRecord[];
  availableMeetings: MeetingRecord[];
};

export function DecisionsShell({
  initialDecisions,
  availableLabels,
  availableMeetings,
}: DecisionsShellProps) {
  const t = useTranslations("decisions");
  const [decisions, setDecisions] =
    useState<DecisionRecord[]>(initialDecisions);
  const [filter, setFilter] = useState<Filter>("all");
  const [editDecision, setEditDecision] = useState<DecisionRecord | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [isPendingRefresh, startRefresh] = useTransition();

  function handleRefresh() {
    startRefresh(async () => {
      const res = await fetch("/api/decisions");
      if (res.ok) {
        const { decisions: updated } = (await res.json()) as {
          decisions: DecisionRecord[];
        };
        setDecisions(updated);
      }
    });
  }

  const {
    creating,
    updating,
    deleting,
    createDecision,
    updateDecision,
    deleteDecision,
  } = useDecisionMutations(setDecisions, {
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
    { key: "decided", label: t("filter.decided") },
    { key: "reversed", label: t("filter.reversed") },
  ];

  const visible =
    filter === "all" ? decisions : decisions.filter((d) => d.status === filter);

  function handleEdit(decision: DecisionRecord) {
    setEditDecision(decision);
    setEditOpen(true);
  }

  function handleDeleteRequest(decisionId: string) {
    setDeleteTarget(decisionId);
    setDeleteOpen(true);
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    await deleteDecision(deleteTarget);
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
          <CreateDecisionDialog
            onSubmit={createDecision}
            creating={creating}
            availableLabels={availableLabels}
            availableMeetings={availableMeetings}
          >
            <Button
              type="button"
              size="sm"
              className="cursor-pointer"
              aria-label={t("newDecision")}
            >
              <Plus className="size-4" />
              {t("newDecision")}
            </Button>
          </CreateDecisionDialog>
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
              ? ` (${decisions.length})`
              : ` (${decisions.filter((d) => d.status === f.key).length})`}
          </Button>
        ))}
      </div>

      {/* Decision list */}
      {visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 px-6 py-16 text-center">
          <p className="text-sm text-muted-foreground">
            {filter === "all" ? t("empty") : t("emptyFiltered")}
          </p>
          {filter === "all" && (
            <CreateDecisionDialog
              onSubmit={createDecision}
              creating={creating}
              availableLabels={availableLabels}
              availableMeetings={availableMeetings}
            >
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-4 cursor-pointer"
              >
                <Plus className="size-4" />
                {t("newDecision")}
              </Button>
            </CreateDecisionDialog>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {visible.map((decision) => (
            <DecisionCard
              key={decision.id}
              decision={decision}
              isUpdating={updating === decision.id}
              isDeleting={deleting === decision.id}
              onEdit={handleEdit}
              onDelete={handleDeleteRequest}
            />
          ))}
        </div>
      )}

      {/* Edit dialog */}
      <EditDecisionDialog
        key={editDecision?.id ?? "edit-decision"}
        decision={editDecision}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSubmit={updateDecision}
        updating={!!updating}
        availableLabels={availableLabels}
        availableMeetings={availableMeetings}
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
