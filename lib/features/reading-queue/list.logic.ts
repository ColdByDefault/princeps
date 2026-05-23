/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version canary-v1.1.4
 */

import "server-only";

import { db } from "@/lib/core/db";
import { READING_ITEM_SELECT, toReadingItemRecord } from "./shared.logic";
import type { ReadingItemRecord } from "@/types/api";

type ListReadingItemsFilter = {
  status?: "unread" | "read" | "archived";
};

export async function listReadingItems(
  userId: string,
  filter: ListReadingItemsFilter = {},
): Promise<ReadingItemRecord[]> {
  const rows = await db.readingItem.findMany({
    where: {
      userId,
      ...(filter.status ? { status: filter.status } : {}),
    },
    orderBy: [{ relevanceScore: "desc" }, { addedAt: "desc" }],
    select: READING_ITEM_SELECT,
  });

  return rows.map(toReadingItemRecord);
}
