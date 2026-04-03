/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { db } from "@/lib/db";
import { LABEL_SELECT, toLabelRecord } from "./shared.logic";
import type { CreateLabelInput } from "./schemas";
import type { LabelRecord } from "@/types/api";

export type CreateLabelResult =
  | { ok: true; label: LabelRecord }
  | { ok: false; duplicate: true }
  | { ok: false; duplicate: false; error: string };

export async function createLabel(
  userId: string,
  input: CreateLabelInput,
): Promise<CreateLabelResult> {
  const normalizedName = input.name.trim().toLowerCase();

  try {
    const row = await db.label.create({
      data: {
        userId,
        name: input.name.trim(),
        color: input.color ?? "#6366f1",
        normalizedName,
      },
      select: LABEL_SELECT,
    });

    return { ok: true, label: toLabelRecord(row) };
  } catch (err: unknown) {
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code: string }).code === "P2002"
    ) {
      return { ok: false, duplicate: true };
    }
    return { ok: false, duplicate: false, error: "Failed to create label" };
  }
}
