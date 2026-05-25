/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version canary-v1.1.10
 * @since canary-v1.1.10
 */

"use client";

import React, { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { PlanBadge } from "@/components/shared";
import {
  SKILL_ALLOWED_TOOLS_MAX,
  SKILL_DESCRIPTION_MAX,
  SKILL_INSTRUCTIONS_MAX,
  SKILL_NAME_MAX,
} from "@/lib/features/skills/schemas";
import type { SkillRecord, ToolDisplayEntry } from "@/types/api";
import type { Tier } from "@/types/billing";
import type { SkillMutationInput } from "./logic/useSkillMutations";

type EditSkillFormProps = {
  skill: SkillRecord;
  onSubmit: (skillId: string, input: SkillMutationInput) => Promise<boolean>;
  onCancel: () => void;
  updating: boolean;
  allTools: ToolDisplayEntry[];
  currentTier: Tier;
};

function groupTools(tools: ToolDisplayEntry[]): [string, ToolDisplayEntry[]][] {
  const grouped = new Map<string, ToolDisplayEntry[]>();

  for (const tool of tools) {
    const list = grouped.get(tool.group) ?? [];
    list.push(tool);
    grouped.set(tool.group, list);
  }

  return Array.from(grouped.entries());
}

export function EditSkillForm({
  skill,
  onSubmit,
  onCancel,
  updating,
  allTools,
  currentTier,
}: EditSkillFormProps) {
  const t = useTranslations("skills");
  const tCommon = useTranslations("common");
  const tTools = useTranslations("tools");
  const [showPreview, setShowPreview] = useState(false);
  const [name, setName] = useState(skill.name.slice(0, SKILL_NAME_MAX));
  const [description, setDescription] = useState(
    skill.description.slice(0, SKILL_DESCRIPTION_MAX),
  );
  const [instructionsMarkdown, setInstructionsMarkdown] = useState(
    skill.instructionsMarkdown.slice(0, SKILL_INSTRUCTIONS_MAX),
  );
  const [selectedTools, setSelectedTools] = useState<string[]>(
    skill.allowedTools.slice(0, SKILL_ALLOWED_TOOLS_MAX),
  );

  const groupedTools = useMemo(() => groupTools(allTools), [allTools]);

  function getGroupLabel(groupKey: string): string {
    if (groupKey === "tasks") return tCommon("entities.tasks");
    if (groupKey === "meetings") return tCommon("entities.meetings");
    if (groupKey === "contacts") return tCommon("entities.contacts");
    if (groupKey === "decisions") return tCommon("entities.decisions");
    if (groupKey === "goals") return tCommon("entities.goals");
    if (groupKey === "labels") return tCommon("entities.labels");
    if (groupKey === "knowledge") return tCommon("entities.knowledge");
    if (groupKey === "memory") return tCommon("entities.memory");
    if (groupKey === "briefings") return tCommon("entities.dailyBriefing");
    if (groupKey === "reading-queue") return tCommon("entities.readingQueue");
    return tTools(`groups.${groupKey}`);
  }

  function toggleTool(toolName: string) {
    setSelectedTools((prev) => {
      if (prev.includes(toolName)) {
        return prev.filter((entry) => entry !== toolName);
      }

      if (prev.length >= SKILL_ALLOWED_TOOLS_MAX) {
        return prev;
      }

      return [...prev, toolName];
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (
      !name.trim() ||
      !description.trim() ||
      !instructionsMarkdown.trim() ||
      selectedTools.length === 0
    ) {
      return;
    }

    await onSubmit(skill.id, {
      name: name.trim(),
      description: description.trim(),
      instructionsMarkdown,
      allowedTools: selectedTools,
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-xl border border-primary/40 bg-card/60 p-4 shadow-sm ring-1 ring-primary/10 sm:p-5"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold tracking-tight">
          {t("editDialog.heading")}
        </h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <p className="text-sm font-medium">{tCommon("fields.name")}</p>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("fields.namePlaceholder")}
            aria-label={tCommon("fields.name")}
            maxLength={SKILL_NAME_MAX}
            required
            autoFocus
          />
          <p className="text-xs text-muted-foreground">
            {name.length}/{SKILL_NAME_MAX}
          </p>
        </div>

        <div className="space-y-1.5">
          <p className="text-sm font-medium">{t("fields.description")}</p>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t("fields.descriptionPlaceholder")}
            aria-label={t("fields.description")}
            maxLength={SKILL_DESCRIPTION_MAX}
            required
          />
          <p className="text-xs text-muted-foreground">
            {description.length}/{SKILL_DESCRIPTION_MAX}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium">{t("fields.instructions")}</p>
          <button
            type="button"
            onClick={() => setShowPreview((prev) => !prev)}
            className="cursor-pointer text-xs text-muted-foreground underline-offset-2 hover:underline"
            aria-label={
              showPreview
                ? t("actions.editMarkdown")
                : t("actions.previewMarkdown")
            }
          >
            {showPreview
              ? t("actions.editMarkdown")
              : t("actions.previewMarkdown")}
          </button>
        </div>

        {showPreview && instructionsMarkdown.trim() ? (
          <div className="rounded-lg border border-border bg-muted/30 px-4 py-3">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t("preview.label")}
            </p>
            <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-ol:my-1 prose-li:my-0 prose-code:before:content-none prose-code:after:content-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {instructionsMarkdown}
              </ReactMarkdown>
            </div>
          </div>
        ) : (
          <Textarea
            value={instructionsMarkdown}
            onChange={(e) => {
              if (e.target.value.length <= SKILL_INSTRUCTIONS_MAX) {
                setInstructionsMarkdown(e.target.value);
              }
            }}
            placeholder={t("fields.instructionsPlaceholder")}
            aria-label={t("fields.instructions")}
            rows={4}
            maxLength={SKILL_INSTRUCTIONS_MAX}
            className="resize-none"
            required
          />
        )}
        <p className="text-xs text-muted-foreground">
          {instructionsMarkdown.length}/{SKILL_INSTRUCTIONS_MAX}
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium">{t("fields.allowedTools")}</p>
          <Badge variant="outline" className="text-xs">
            {t("selectedTools", { count: selectedTools.length })} /{" "}
            {SKILL_ALLOWED_TOOLS_MAX}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          {t("fields.allowedToolsHelp")}
        </p>

        <ScrollArea className="h-56 rounded-lg border border-border/60 p-3">
          <div className="space-y-4 pr-2">
            {groupedTools.map(([groupKey, tools]) => (
              <div key={groupKey} className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {getGroupLabel(groupKey)}
                </p>
                <div className="space-y-1.5">
                  {tools.map((tool) => {
                    const checked = selectedTools.includes(tool.name);
                    const atToolLimit =
                      selectedTools.length >= SKILL_ALLOWED_TOOLS_MAX;
                    const disabled = !checked && atToolLimit;

                    return (
                      <label
                        key={tool.name}
                        className={`flex items-center gap-2 rounded-md border border-border/60 px-2.5 py-2 ${
                          disabled
                            ? "cursor-not-allowed opacity-50"
                            : "cursor-pointer hover:bg-muted/40"
                        }`}
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={() => toggleTool(tool.name)}
                          aria-label={tool.name}
                          disabled={disabled}
                          className="cursor-pointer"
                        />
                        <span className="font-mono text-xs text-foreground">
                          {tool.name}
                        </span>
                        <div className="ml-auto flex items-center gap-1.5">
                          <PlanBadge tier={tool.minTier} />
                          {tool.minTier !== currentTier && (
                            <span className="text-[10px] text-muted-foreground">
                              {t("tierHint")}
                            </span>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      <div className="flex items-center justify-end gap-2 pt-1">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={updating}
          className="cursor-pointer"
          aria-label={tCommon("actions.cancel")}
        >
          {tCommon("actions.cancel")}
        </Button>
        <Button
          type="submit"
          className="cursor-pointer"
          disabled={
            updating ||
            !name.trim() ||
            !description.trim() ||
            !instructionsMarkdown.trim() ||
            selectedTools.length === 0
          }
        >
          {updating ? tCommon("states.saving") : tCommon("actions.save")}
        </Button>
      </div>
    </form>
  );
}
