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
import { LABEL_SELECT, toLabelRecord } from "./shared.logic";
import type { LabelRecord } from "@/types/api";

export async function listLabels(userId: string): Promise<LabelRecord[]> {
  const rows = await db.label.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    select: LABEL_SELECT,
  });

  return rows.map(toLabelRecord);
}
