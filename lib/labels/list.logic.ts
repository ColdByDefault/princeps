/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { db } from "@/lib/db";
import type { LabelRecord } from "@/types/api";
import { labelRecordSelect, toLabelRecord } from "./shared.logic";

export async function listLabels(userId: string): Promise<LabelRecord[]> {
  const rows = await db.label.findMany({
    where: { userId },
    select: labelRecordSelect,
    orderBy: [{ normalizedName: "asc" }, { createdAt: "asc" }],
  });

  return rows.map(toLabelRecord);
}
