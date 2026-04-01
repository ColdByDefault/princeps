/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { db } from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";
import type { LabelOptionRecord, LabelRecord } from "@/types/api";
import { normalizeLabelName, sanitizeLabelName } from "./normalize";

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

export async function resolveOwnedLabelIdsByNames(
  userId: string,
  labelNames: string[] | undefined,
): Promise<{ labelIds: string[]; unresolvedNames: string[] }> {
  const sanitizedNames = (labelNames ?? [])
    .filter((labelName): labelName is string => typeof labelName === "string")
    .map(sanitizeLabelName)
    .filter(Boolean);

  if (sanitizedNames.length === 0) {
    return { labelIds: [], unresolvedNames: [] };
  }

  const normalizedToOriginal = new Map<string, string>();
  for (const labelName of sanitizedNames) {
    const normalizedName = normalizeLabelName(labelName);
    if (!normalizedToOriginal.has(normalizedName)) {
      normalizedToOriginal.set(normalizedName, labelName);
    }
  }

  const rows = await db.label.findMany({
    where: {
      userId,
      normalizedName: { in: [...normalizedToOriginal.keys()] },
    },
    select: {
      id: true,
      normalizedName: true,
    },
  });

  const idByNormalizedName = new Map(
    rows.map((row) => [row.normalizedName, row.id]),
  );

  const labelIds: string[] = [];
  const unresolvedNames: string[] = [];

  for (const [normalizedName, originalName] of normalizedToOriginal) {
    const labelId = idByNormalizedName.get(normalizedName);
    if (labelId) {
      labelIds.push(labelId);
    } else {
      unresolvedNames.push(originalName);
    }
  }

  return { labelIds, unresolvedNames };
}
