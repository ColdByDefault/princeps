import "server-only";
import { db } from "@/lib/db";

export async function deleteDecision(
  decisionId: string,
  userId: string,
): Promise<{ ok: boolean }> {
  const { count } = await db.decision.deleteMany({
    where: { id: decisionId, userId },
  });
  return { ok: count > 0 };
}
