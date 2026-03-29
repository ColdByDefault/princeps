/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { db } from "@/lib/db";

export async function deleteDecision(
  userId: string,
  decisionId: string,
): Promise<boolean> {
  const existing = await db.decision.findFirst({
    where: { id: decisionId, userId },
  });
  if (!existing) return false;
  await db.decision.delete({ where: { id: decisionId } });
  return true;
}
