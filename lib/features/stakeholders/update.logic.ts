/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version canary-v1.1.4
 * @since canary-v1.1.4
 */

import "server-only";
import { db } from "@/lib/core/db";
import { STAKEHOLDER_SELECT, toStakeholderRecord } from "./shared.logic";
import type { UpdateStakeholderInput } from "./schemas";
import type { StakeholderRecord } from "@/types/api";

export type UpdateStakeholderResult =
  | { ok: true; stakeholder: StakeholderRecord }
  | { ok: false; notFound: true }
  | { ok: false; notFound: false; error: string };

export async function updateStakeholder(
  id: string,
  userId: string,
  input: UpdateStakeholderInput,
): Promise<UpdateStakeholderResult> {
  const row = await db.stakeholderEntry
    .update({
      where: { id, userId },
      data: {
        ...(input.role !== undefined && { role: input.role }),
        ...(input.health !== undefined && { health: input.health }),
        ...(input.notes !== undefined && { notes: input.notes }),
      },
      select: STAKEHOLDER_SELECT,
    })
    .catch(() => null);

  if (!row) return { ok: false, notFound: true };
  return { ok: true, stakeholder: toStakeholderRecord(row) };
}
