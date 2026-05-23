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
import type { StakeholderRecord } from "@/types/api";

export async function listStakeholders(
  userId: string,
  filter?: { goalId?: string },
): Promise<StakeholderRecord[]> {
  const rows = await db.stakeholderEntry.findMany({
    where: {
      userId,
      ...(filter?.goalId !== undefined ? { goalId: filter.goalId } : {}),
    },
    select: STAKEHOLDER_SELECT,
    orderBy: { createdAt: "asc" },
  });

  return rows.map(toStakeholderRecord);
}
