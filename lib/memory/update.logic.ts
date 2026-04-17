/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * SPDX-License-Identifier: Elastic-2.0
 */

import "server-only";

import { db } from "@/lib/db";
import type { UpdateMemoryEntryInput } from "./schemas";
import { MEMORY_ENTRY_SELECT, toMemoryEntryRecord } from "./shared.logic";
import type { MemoryEntryRecord } from "@/types/api";

export async function updateMemoryEntry(
  userId: string,
  id: string,
  data: UpdateMemoryEntryInput,
): Promise<MemoryEntryRecord | null> {
  const row = await db.memoryEntry
    .update({
      where: { id, userId },
      data: {
        ...(data.key !== undefined && { key: data.key }),
        ...(data.value !== undefined && { value: data.value }),
      },
      select: MEMORY_ENTRY_SELECT,
    })
    .catch(() => null);

  return row ? toMemoryEntryRecord(row) : null;
}
