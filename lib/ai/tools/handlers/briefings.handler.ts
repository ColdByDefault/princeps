/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version beta
 * @since beta
 * @module
 * @description
 */

import "server-only";

import { getBriefing } from "@/lib/features/briefings/get.logic";
import { generateBriefing } from "@/lib/features/briefings/generate.logic";
import { enforceBriefingMonthly } from "@/lib/platform/tiers";
import type { ActionResult, ToolHandler } from "@/lib/ai/tools/types";

async function handleGetBriefing(userId: string): Promise<ActionResult> {
  const briefing = await getBriefing(userId);
  if (!briefing) {
    return {
      ok: true,
      data: { briefing: null, message: "No briefing generated yet." },
    };
  }
  return { ok: true, data: briefing };
}

async function handleRegenerateBriefing(userId: string): Promise<ActionResult> {
  const gate = await enforceBriefingMonthly(userId);
  if (!gate.allowed) {
    return {
      ok: false,
      error: gate.reason ?? "Briefing limit reached for your plan.",
    };
  }

  const result = await generateBriefing(userId);
  if (!result.ok) {
    return { ok: false, error: result.error };
  }
  return { ok: true, data: result.briefing };
}

export const briefingHandlers: Record<string, ToolHandler> = {
  get_briefing: (userId) => handleGetBriefing(userId),
  regenerate_briefing: (userId) => handleRegenerateBriefing(userId),
};
