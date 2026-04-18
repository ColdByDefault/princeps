/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version beta
 * @since beta
 * @module
 * @description
 */

"use client";

import { useState } from "react";
import { ChevronDown, Lock } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { PlanBadge, CustomToggle } from "@/components/shared";
import type { Tier } from "@/types/billing";
import type { ToolDisplayEntry } from "@/types/api";

const TIER_ORDER: Tier[] = ["free", "pro", "premium", "enterprise"];

function isUnlocked(minTier: Tier, userTier: Tier): boolean {
  return TIER_ORDER.indexOf(minTier) <= TIER_ORDER.indexOf(userTier);
}

type ToolsTabProps = {
  tier: Tier;
  allTools: ToolDisplayEntry[];
  initialDisabledTools: string[];
};

export function ToolsTab({
  tier,
  allTools,
  initialDisabledTools,
}: ToolsTabProps) {
  const t = useTranslations("settings.tools");
  const tTools = useTranslations("tools");
  const [disabled, setDisabled] = useState<Set<string>>(
    new Set(initialDisabledTools),
  );
  const [saving, setSaving] = useState<string | null>(null);

  async function handleToggle(toolName: string, enabled: boolean) {
    setSaving(toolName);
    const next = new Set(disabled);
    if (enabled) {
      next.delete(toolName);
    } else {
      next.add(toolName);
    }

    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ disabledTools: Array.from(next) }),
      });
      if (!res.ok) {
        toast.error(t("saveFailed"));
        return;
      }
      setDisabled(next);
    } catch {
      toast.error(t("saveFailed"));
    } finally {
      setSaving(null);
    }
  }

  // Group tools by their group key, preserving registry order
  const groups = allTools.reduce<Map<string, ToolDisplayEntry[]>>(
    (acc, tool) => {
      const list = acc.get(tool.group) ?? [];
      list.push(tool);
      acc.set(tool.group, list);
      return acc;
    },
    new Map(),
  );

  return (
    <div className="space-y-2">
      {/* Section header */}
      <div className="space-y-0.5 pb-4">
        <p className="text-sm font-medium">{t("title")}</p>
        <p className="text-sm text-muted-foreground">{t("description")}</p>
      </div>

      {/* Tool groups */}
      <div className="space-y-3">
        {Array.from(groups.entries()).map(([groupKey, tools]) => (
          <Collapsible key={groupKey} defaultOpen={false}>
            <CollapsibleTrigger className="group flex w-full cursor-pointer items-center justify-between gap-2 pb-1.5">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground hover:text-foreground transition-colors">
                {tTools(`groups.${groupKey}`)}
              </p>
              <ChevronDown className="size-3.5 shrink-0 text-muted-foreground transition-transform duration-200 group-data-panel-open:rotate-180" />
            </CollapsibleTrigger>

            <CollapsibleContent>
              <div className="divide-y divide-border/60 rounded-xl border border-border/60">
                {tools.map((tool) => {
                  const unlocked = isUnlocked(tool.minTier, tier);
                  const enabled = !disabled.has(tool.name);
                  const isSaving = saving === tool.name;

                  return (
                    <div
                      key={tool.name}
                      className={`space-y-1 px-4 py-3 ${!unlocked ? "opacity-50" : ""}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 space-y-1 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge
                              variant="outline"
                              className="font-mono text-xs text-muted-foreground"
                            >
                              {tool.name}
                            </Badge>
                            <span className="text-sm font-medium">
                              {tTools(`catalog.${tool.name}.label`)}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {tTools(`catalog.${tool.name}.what`)}
                          </p>
                          <p className="text-xs italic text-muted-foreground/70">
                            {tTools(`catalog.${tool.name}.example`)}
                          </p>
                        </div>

                        <div className="flex shrink-0 items-center gap-2 pt-0.5">
                          {!unlocked ? (
                            <>
                              <Lock className="size-3.5 text-muted-foreground" />
                              <PlanBadge tier={tool.minTier} />
                              <CustomToggle
                                checked={false}
                                onCheckedChange={() => {}}
                                disabled
                                aria-label={tTools(
                                  `catalog.${tool.name}.label`,
                                )}
                              />
                            </>
                          ) : (
                            <CustomToggle
                              checked={enabled}
                              onCheckedChange={(v) =>
                                void handleToggle(tool.name, v)
                              }
                              disabled={isSaving}
                              aria-label={tTools(`catalog.${tool.name}.label`)}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CollapsibleContent>
          </Collapsible>
        ))}
      </div>
    </div>
  );
}
