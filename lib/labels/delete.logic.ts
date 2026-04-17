/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * SPDX-License-Identifier: Elastic-2.0
 */

import "server-only";

import { db } from "@/lib/db";

export async function deleteLabel(
  labelId: string,
  userId: string,
): Promise<{ ok: boolean }> {
  const { count } = await db.label.deleteMany({
    where: { id: labelId, userId },
  });

  return { ok: count > 0 };
}
