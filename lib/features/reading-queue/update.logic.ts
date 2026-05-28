/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version canary-v1.2.1
 * @since canary-v1.1.4
 */

import "server-only";

import { db } from "@/lib/core/db";
import { READING_ITEM_SELECT, toReadingItemRecord } from "./shared.logic";
import type { UpdateReadingItemInput } from "./schemas";
import type { ReadingItemRecord } from "@/types/api";

type UpdateResult =
  | { ok: true; record: ReadingItemRecord }
  | { ok: false; notFound: true };

export async function updateReadingItem(
  userId: string,
  id: string,
  input: UpdateReadingItemInput,
): Promise<UpdateResult> {
  const existing = await db.readingItem.findFirst({
    where: { id, userId },
    select: { id: true },
  });

  if (!existing) return { ok: false, notFound: true };

  const now = new Date();
  const row = await db.readingItem.update({
    where: { id },
    data: {
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.status === "read" ? { readAt: now } : {}),
      // Clear readAt when moving back to unread or to archived so the timeline
      // accurately reflects the article's current state.
      ...(input.status === "unread" || input.status === "archived"
        ? { readAt: null }
        : {}),
    },
    select: READING_ITEM_SELECT,
  });

  return { ok: true, record: toReadingItemRecord(row) };
}
