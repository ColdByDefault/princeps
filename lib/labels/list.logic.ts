/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { db } from "@/lib/db";
import type { LabelRecord } from "@/types/api";

type LabelRow = Awaited<ReturnType<typeof db.label.findFirst>>;

export function toLabelRecord(row: NonNullable<LabelRow>): LabelRecord {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listLabels(userId: string): Promise<LabelRecord[]> {
  const rows = await db.label.findMany({
    where: { userId },
    orderBy: [{ normalizedName: "asc" }, { createdAt: "asc" }],
  });

  return rows.map(toLabelRecord);
}
