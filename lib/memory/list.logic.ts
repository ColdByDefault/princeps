/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * SPDX-License-Identifier: Elastic-2.0
 */

import "server-only";

import { db } from "@/lib/db";
import { MEMORY_ENTRY_SELECT, toMemoryEntryRecord } from "./shared.logic";
import type { MemoryEntryRecord } from "@/types/api";

export async function listMemoryEntries(
  userId: string,
): Promise<MemoryEntryRecord[]> {
  const rows = await db.memoryEntry.findMany({
    where: { userId },
    select: MEMORY_ENTRY_SELECT,
    orderBy: { updatedAt: "desc" },
  });

  return rows.map(toMemoryEntryRecord);
}
