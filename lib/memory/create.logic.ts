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

import { db } from "@/lib/db";
import type { CreateMemoryEntryInput } from "./schemas";
import { MEMORY_ENTRY_SELECT, toMemoryEntryRecord } from "./shared.logic";
import type { MemoryEntryRecord } from "@/types/api";

export async function createMemoryEntry(
  userId: string,
  data: CreateMemoryEntryInput,
  source: "llm" | "user" = "user",
): Promise<MemoryEntryRecord> {
  const row = await db.memoryEntry.create({
    data: {
      userId,
      key: data.key,
      value: data.value,
      source,
    },
    select: MEMORY_ENTRY_SELECT,
  });

  return toMemoryEntryRecord(row);
}
