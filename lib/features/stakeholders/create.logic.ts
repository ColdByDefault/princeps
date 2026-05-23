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
import type { CreateStakeholderInput } from "./schemas";
import type { StakeholderRecord } from "@/types/api";

export type CreateStakeholderResult =
  | { ok: true; stakeholder: StakeholderRecord }
  | { ok: false; error: string };

export async function createStakeholder(
  userId: string,
  input: CreateStakeholderInput,
): Promise<CreateStakeholderResult> {
  // Verify the contact belongs to this user
  const contact = await db.contact.findFirst({
    where: { id: input.contactId, userId },
    select: { id: true },
  });
  if (!contact) {
    return { ok: false, error: "Contact not found." };
  }

  // Verify the goal belongs to this user (if provided)
  if (input.goalId) {
    const goal = await db.goal.findFirst({
      where: { id: input.goalId, userId },
      select: { id: true },
    });
    if (!goal) {
      return { ok: false, error: "Goal not found." };
    }
  }

  const row = await db.stakeholderEntry.create({
    data: {
      userId,
      contactId: input.contactId,
      goalId: input.goalId ?? null,
      role: input.role ?? null,
      health: input.health ?? "neutral",
      notes: input.notes ?? null,
    },
    select: STAKEHOLDER_SELECT,
  });

  return { ok: true, stakeholder: toStakeholderRecord(row) };
}
