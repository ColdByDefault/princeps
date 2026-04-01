/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { Prisma } from "@/lib/generated/prisma/client";
import { db } from "@/lib/db";
import type { LabelRecord } from "@/types/api";
import { normalizeLabelName, sanitizeLabelName } from "./normalize";
import { labelRecordSelect, toLabelRecord } from "./shared.logic";

export type UpdateLabelResult =
  | { ok: true; label: LabelRecord }
  | { ok: false; error: "duplicate" | "not_found" };

export async function updateLabel(
  userId: string,
  labelId: string,
  name: string,
): Promise<UpdateLabelResult> {
  const existing = await db.label.findUnique({
    where: { id: labelId },
    select: { userId: true },
  });

  if (!existing || existing.userId !== userId) {
    return { ok: false, error: "not_found" };
  }

  const sanitizedName = sanitizeLabelName(name);
  const normalizedName = normalizeLabelName(sanitizedName);

  try {
    const row = await db.label.update({
      where: { id: labelId },
      select: labelRecordSelect,
      data: {
        name: sanitizedName,
        normalizedName,
      },
    });

    return { ok: true, label: toLabelRecord(row) };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { ok: false, error: "duplicate" };
    }

    throw error;
  }
}
