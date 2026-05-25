/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version canary-v1.1.10
 * @since canary-v1.1.10
 */

"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { SkillRecord } from "@/types/api";

type SkillCardProps = {
  skill: SkillRecord;
  isUpdating: boolean;
  isDeleting: boolean;
  onEdit: (skill: SkillRecord) => void;
  onDelete: (skillId: string) => void;
};

function formatShortDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function SkillCard({
  skill,
  isUpdating,
  isDeleting,
  onEdit,
  onDelete,
}: SkillCardProps) {
  const t = useTranslations("skills");
  const tCommon = useTranslations("common");

  return (
    <Card>
      <CardHeader className="gap-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <CardTitle className="truncate">{skill.name}</CardTitle>
            <CardDescription>{skill.description}</CardDescription>
          </div>
          <span className="shrink-0 rounded-full border border-border/60 bg-muted/50 px-2 py-0.5 text-[11px] text-muted-foreground">
            {t("updatedAt", { date: formatShortDate(skill.updatedAt) })}
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t("fields.instructions")}
          </p>
          <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">
            {skill.instructionsMarkdown}
          </p>
        </div>

        <div className="space-y-1.5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t("fields.allowedTools")}
          </p>
          {skill.allowedTools.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("noTools")}</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {skill.allowedTools.map((toolName) => (
                <span
                  key={toolName}
                  className="rounded-sm border border-border/60 bg-muted/40 px-2 py-0.5 font-mono text-[11px] text-foreground"
                >
                  {toolName}
                </span>
              ))}
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onEdit(skill)}
          className="cursor-pointer"
          aria-label={t("actions.edit")}
          disabled={isUpdating || isDeleting}
        >
          {tCommon("actions.edit")}
        </Button>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={() => onDelete(skill.id)}
          className="cursor-pointer"
          aria-label={t("actions.delete")}
          disabled={isUpdating || isDeleting}
        >
          {tCommon("actions.delete")}
        </Button>
      </CardFooter>
    </Card>
  );
}
