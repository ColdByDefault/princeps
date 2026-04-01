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

export type CreateLabelResult =
  | { ok: true; label: LabelRecord }
  | { ok: false; error: "duplicate" };

export async function createLabel(
  userId: string,
  name: string,
): Promise<CreateLabelResult> {
  const sanitizedName = sanitizeLabelName(name);
  const normalizedName = normalizeLabelName(sanitizedName);

  try {
    const row = await db.label.create({
      select: labelRecordSelect,
      data: {
        userId,
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
