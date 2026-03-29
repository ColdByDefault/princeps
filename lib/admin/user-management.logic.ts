/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { db } from "@/lib/db";

const ALLOWED_TIERS = ["free", "pro", "premium"] as const;
type AllowedTier = (typeof ALLOWED_TIERS)[number];

export async function setUserTier(
  userId: string,
  tier: AllowedTier,
): Promise<void> {
  if (!(ALLOWED_TIERS as readonly string[]).includes(tier)) {
    throw new Error("Invalid tier");
  }
  await db.user.update({ where: { id: userId }, data: { tier } });
}

export async function deleteUser(userId: string): Promise<void> {
  await db.user.delete({ where: { id: userId } });
}
