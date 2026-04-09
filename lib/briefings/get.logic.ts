/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { db } from "@/lib/db";
import type { BriefingRecord } from "@/types/api";

/**
 * Returns the cached briefing for the user, or null if none exists yet.
 */
export async function getBriefing(
  userId: string,
): Promise<BriefingRecord | null> {
  const row = await db.briefingCache.findUnique({
    where: { userId },
    select: { id: true, content: true, generatedAt: true },
  });

  if (!row) return null;

  return {
    id: row.id,
    content: row.content,
    generatedAt: row.generatedAt.toISOString(),
  };
}
