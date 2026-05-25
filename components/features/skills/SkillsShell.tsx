/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version canary-v1.1.10
 * @since canary-v1.1.10
 */

"use client";

import { useState, useTransition } from "react";
import { Plus, RefreshCw, X } from "lucide-react";
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
import { SkillCard } from "./SkillCard";
import { CreateSkillForm } from "./CreateSkillForm";
import { EditSkillForm } from "./EditSkillForm";
import { useSkillMutations } from "./logic/useSkillMutations";
import type { SkillMutationInput } from "./logic/useSkillMutations";
import type { SkillRecord, ToolDisplayEntry } from "@/types/api";
import type { Tier } from "@/types/billing";

type SkillsShellProps = {
  initialSkills: SkillRecord[];
  allTools: ToolDisplayEntry[];
  currentTier: Tier;
  skillsLimit: number;
};

export function SkillsShell({
  initialSkills,
  allTools,
  currentTier,
  skillsLimit,
}: SkillsShellProps) {
  const t = useTranslations("skills");
  const tCommon = useTranslations("common");
  const [skills, setSkills] = useState<SkillRecord[]>(initialSkills);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isPendingRefresh, startRefresh] = useTransition();

  const {
    creating,
    updating,
    deleting,
    createSkill,
    updateSkill,
    deleteSkill,
  } = useSkillMutations(setSkills, {
    createSuccess: t("createDialog.success"),
    createError: t("createDialog.error"),
    updateSuccess: t("editDialog.success"),
    updateError: t("editDialog.error"),
    deleteSuccess: t("deleteDialog.success"),
    deleteError: t("deleteDialog.error"),
    invalidToolsError: t("errors.invalidTools"),
    limitReached: t("errors.limitReached"),
    notFound: t("errors.notFound"),
  });

  const isAtLimit = skillsLimit !== -1 && skills.length >= skillsLimit;

  const usageLabel =
    skillsLimit === -1
      ? t("usage.unlimited", { used: skills.length })
      : t("usage.limited", { used: skills.length, limit: skillsLimit });

  function handleRefresh() {
    startRefresh(async () => {
      const res = await fetch("/api/skills");

      if (!res.ok) {
        return;
      }

      const data = (await res.json()) as { skills: SkillRecord[] };
      setSkills(data.skills);
    });
  }

  function handleEdit(skill: SkillRecord) {
    setEditingId(skill.id);
    setCreateOpen(false);
  }

  function handleDeleteRequest(skillId: string) {
    setDeleteTarget(skillId);
    setDeleteOpen(true);
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) {
      return;
    }

    const ok = await deleteSkill(deleteTarget);

    if (ok) {
      setDeleteOpen(false);
      setDeleteTarget(null);
    }
  }

  async function handleCreateSubmit(input: SkillMutationInput) {
    const ok = await createSkill(input);

    if (ok) {
      setCreateOpen(false);
    }

    return ok;
  }

  async function handleUpdateSubmit(
    skillId: string,
    input: SkillMutationInput,
  ) {
    const ok = await updateSkill(skillId, input);

    if (ok) {
      setEditingId(null);
    }

    return ok;
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            {tCommon("entities.skills")}
          </h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
          <p
            className={`text-xs ${
              isAtLimit ? "text-destructive" : "text-muted-foreground"
            }`}
          >
            {usageLabel}
          </p>
        </div>

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

          <Button
            type="button"
            size="sm"
            className="cursor-pointer"
            aria-label={createOpen ? tCommon("actions.cancel") : t("newSkill")}
            disabled={isAtLimit && !createOpen}
            onClick={() => setCreateOpen((prev) => !prev)}
          >
            {createOpen ? (
              <>
                <X className="size-4" />
                {tCommon("actions.cancel")}
              </>
            ) : (
              <>
                <Plus className="size-4" />
                {t("newSkill")}
              </>
            )}
          </Button>
        </div>
      </div>

      {createOpen && (
        <CreateSkillForm
          onSubmit={handleCreateSubmit}
          onCancel={() => setCreateOpen(false)}
          creating={creating}
          allTools={allTools}
          currentTier={currentTier}
        />
      )}

      {skills.length === 0 && !createOpen ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 px-6 py-14 text-center">
          <p className="text-sm text-muted-foreground">{t("empty")}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-4 cursor-pointer"
            disabled={isAtLimit}
            aria-label={t("newSkill")}
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="size-4" />
            {t("newSkill")}
          </Button>
        </div>
      ) : skills.length === 0 ? null : (
        <div className="space-y-3">
          {skills.map((skill) =>
            editingId === skill.id ? (
              <EditSkillForm
                key={skill.id}
                skill={skill}
                onSubmit={handleUpdateSubmit}
                onCancel={() => setEditingId(null)}
                updating={updating === skill.id}
                allTools={allTools}
                currentTier={currentTier}
              />
            ) : (
              <SkillCard
                key={skill.id}
                skill={skill}
                isUpdating={updating === skill.id}
                isDeleting={deleting === skill.id}
                onEdit={handleEdit}
                onDelete={handleDeleteRequest}
              />
            ),
          )}
        </div>
      )}

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
              className="cursor-pointer"
              disabled={deleting !== null}
            >
              {tCommon("actions.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
