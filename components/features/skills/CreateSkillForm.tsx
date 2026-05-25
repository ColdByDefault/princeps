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
import type { ToolDisplayEntry } from "@/types/api";
import type { Tier } from "@/types/billing";
import type { SkillMutationInput } from "./logic/useSkillMutations";

type CreateSkillFormProps = {
  onSubmit: (input: SkillMutationInput) => Promise<boolean>;
  onCancel: () => void;
  creating: boolean;
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

export function CreateSkillForm({
  onSubmit,
  onCancel,
  creating,
  allTools,
  currentTier,
}: CreateSkillFormProps) {
  const t = useTranslations("skills");
  const tCommon = useTranslations("common");
  const tTools = useTranslations("tools");
  const [showPreview, setShowPreview] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [instructionsMarkdown, setInstructionsMarkdown] = useState("");
  const [selectedTools, setSelectedTools] = useState<string[]>([]);

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
    setSelectedTools((prev) =>
      prev.includes(toolName)
        ? prev.filter((entry) => entry !== toolName)
        : [...prev, toolName],
    );
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

    const ok = await onSubmit({
      name: name.trim(),
      description: description.trim(),
      instructionsMarkdown,
      allowedTools: selectedTools,
    });

    if (ok) {
      setName("");
      setDescription("");
      setInstructionsMarkdown("");
      setSelectedTools([]);
      setShowPreview(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-6 space-y-4 rounded-xl border border-border/60 bg-card/50 p-4 sm:p-5"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold tracking-tight">
          {t("createDialog.heading")}
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
            maxLength={100}
            required
            autoFocus
          />
          <p className="text-xs text-muted-foreground">{name.length}/100</p>
        </div>

        <div className="space-y-1.5">
          <p className="text-sm font-medium">{t("fields.description")}</p>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t("fields.descriptionPlaceholder")}
            aria-label={t("fields.description")}
            maxLength={500}
            required
          />
          <p className="text-xs text-muted-foreground">
            {description.length}/500
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
              if (e.target.value.length <= 20_000) {
                setInstructionsMarkdown(e.target.value);
              }
            }}
            placeholder={t("fields.instructionsPlaceholder")}
            aria-label={t("fields.instructions")}
            rows={8}
            className="resize-none"
            required
          />
        )}
        <p className="text-xs text-muted-foreground">
          {instructionsMarkdown.length}/20000
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium">{t("fields.allowedTools")}</p>
          <Badge variant="outline" className="text-xs">
            {t("selectedTools", { count: selectedTools.length })}
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

                    return (
                      <label
                        key={tool.name}
                        className="flex cursor-pointer items-center gap-2 rounded-md border border-border/60 px-2.5 py-2 hover:bg-muted/40"
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={() => toggleTool(tool.name)}
                          aria-label={tool.name}
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
          disabled={creating}
          className="cursor-pointer"
          aria-label={tCommon("actions.cancel")}
        >
          {tCommon("actions.cancel")}
        </Button>
        <Button
          type="submit"
          className="cursor-pointer"
          disabled={
            creating ||
            !name.trim() ||
            !description.trim() ||
            !instructionsMarkdown.trim() ||
            selectedTools.length === 0
          }
        >
          {creating ? tCommon("states.creating") : tCommon("actions.create")}
        </Button>
      </div>
    </form>
  );
}
