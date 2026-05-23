/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version canary-v1.1.4
 * @since canary-v1.1.4
 */

import "server-only";
import { db } from "@/lib/core/db";

export type DeleteStakeholderResult =
  | { ok: true }
  | { ok: false; notFound: true };

export async function deleteStakeholder(
  id: string,
  userId: string,
): Promise<DeleteStakeholderResult> {
  const deleted = await db.stakeholderEntry
    .delete({ where: { id, userId } })
    .catch(() => null);

  if (!deleted) return { ok: false, notFound: true };
  return { ok: true };
}
