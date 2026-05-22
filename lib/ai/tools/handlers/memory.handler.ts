/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version beta
 * @since beta
 */

import "server-only";

import { createMemoryEntry } from "@/lib/features/memory/create.logic";
import { listMemoryEntries } from "@/lib/features/memory/list.logic";
import { deleteMemoryEntry } from "@/lib/features/memory/delete.logic";
import { createMemoryEntrySchema } from "@/lib/features/memory/schemas";
import { enforceMemoryMax } from "@/lib/platform/tiers";
import type { ActionResult, ToolHandler } from "@/lib/ai/tools/types";

async function handleRememberFact(
  userId: string,
  args: Record<string, unknown>,
): Promise<ActionResult> {
  const parsed = createMemoryEntrySchema.safeParse(args);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid remember_fact input.",
    };
  }

  const gate = await enforceMemoryMax(userId);
  if (!gate.allowed) {
    return {
      ok: false,
      error: gate.reason ?? "Memory entry limit reached for your plan.",
    };
  }

  const entry = await createMemoryEntry(userId, parsed.data, "llm");
  return { ok: true, data: entry };
}

async function handleRecallFacts(userId: string): Promise<ActionResult> {
  const entries = await listMemoryEntries(userId);
  return { ok: true, data: { entries } };
}

async function handleForgetFact(
  userId: string,
  args: Record<string, unknown>,
): Promise<ActionResult> {
  const id = typeof args.id === "string" ? args.id : null;
  if (!id) {
    return { ok: false, error: "Missing required parameter: id." };
  }

  const result = await deleteMemoryEntry(userId, id);
  if (!result.ok) {
    return { ok: false, error: "Memory entry not found." };
  }

  return { ok: true, data: { deleted: true } };
}

export const memoryHandlers: Record<string, ToolHandler> = {
  remember_fact: handleRememberFact,
  recall_facts: (userId) => handleRecallFacts(userId),
  forget_fact: handleForgetFact,
};
