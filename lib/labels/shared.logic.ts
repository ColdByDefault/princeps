/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { db } from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";
import type { LabelOptionRecord, LabelRecord } from "@/types/api";

export const labelRecordSelect = {
  id: true,
  name: true,
  color: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.LabelSelect;

export const labelOptionSelect = {
  id: true,
  name: true,
  color: true,
} satisfies Prisma.LabelSelect;

export type LabelRecordRow = Prisma.LabelGetPayload<{
  select: typeof labelRecordSelect;
}>;

export type LabelOptionRow = Prisma.LabelGetPayload<{
  select: typeof labelOptionSelect;
}>;

export class InvalidLabelSelectionError extends Error {
  constructor() {
    super("One or more labels are invalid.");
  }
}

export function toLabelOptionRecord(row: LabelOptionRow): LabelOptionRecord {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
  };
}

export function toLabelRecord(row: LabelRecordRow): LabelRecord {
  return {
    ...toLabelOptionRecord(row),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function assertOwnedLabelIds(
  userId: string,
  labelIds: string[] | undefined,
): Promise<string[]> {
  const uniqueLabelIds = [...new Set((labelIds ?? []).filter(Boolean))];

  if (uniqueLabelIds.length === 0) {
    return [];
  }

  const rows = await db.label.findMany({
    where: {
      userId,
      id: { in: uniqueLabelIds },
    },
    select: { id: true },
  });

  if (rows.length !== uniqueLabelIds.length) {
    throw new InvalidLabelSelectionError();
  }

  return uniqueLabelIds;
}
