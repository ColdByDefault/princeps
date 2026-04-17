/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * SPDX-License-Identifier: Elastic-2.0
 */

import "server-only";

import { createMemoryEntry } from "@/lib/memory/create.logic";
import { listMemoryEntries } from "@/lib/memory/list.logic";
import { deleteMemoryEntry } from "@/lib/memory/delete.logic";
import { createMemoryEntrySchema } from "@/lib/memory/schemas";
import { enforceMemoryMax } from "@/lib/tiers";
import type { ActionResult, ToolHandler } from "@/lib/tools/types";

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
