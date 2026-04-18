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
import type { UpdateLabelInput } from "./schemas";
import type { LabelRecord } from "@/types/api";

export type UpdateLabelResult =
  | { ok: true; label: LabelRecord }
  | { ok: false; notFound: true }
  | { ok: false; notFound: false; duplicate: true }
  | { ok: false; notFound: false; duplicate: false; error: string };

export async function updateLabel(
  labelId: string,
  userId: string,
  input: UpdateLabelInput,
): Promise<UpdateLabelResult> {
  const data: Record<string, unknown> = {};

  if (input.name !== undefined) {
    data.name = input.name.trim();
    data.normalizedName = input.name.trim().toLowerCase();
  }
  if (input.color !== undefined) {
    data.color = input.color;
  }
  if (input.icon !== undefined) {
    data.icon = input.icon;
  }

  try {
    const row = await db.label.update({
      where: { id: labelId, userId },
      data,
      select: LABEL_SELECT,
    });

    return { ok: true, label: toLabelRecord(row) };
  } catch (err: unknown) {
    if (typeof err === "object" && err !== null && "code" in err) {
      const code = (err as { code: string }).code;
      if (code === "P2025") return { ok: false, notFound: true };
      if (code === "P2002")
        return { ok: false, notFound: false, duplicate: true };
    }
    return {
      ok: false,
      notFound: false,
      duplicate: false,
      error: "Failed to update label",
    };
  }
}
