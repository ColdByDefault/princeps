/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { db } from "@/lib/db";

/**
 * Revokes a specific share token that belongs to the user.
 * Returns true if a token was actually revoked, false if not found.
 */
export async function revokeShareToken(
  userId: string,
  tokenId: string,
): Promise<boolean> {
  const result = await db.shareToken.updateMany({
    where: { id: tokenId, userId, revoked: false },
    data: { revoked: true },
  });

  return result.count > 0;
}
