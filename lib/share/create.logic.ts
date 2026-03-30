/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { db } from "@/lib/db";
import type { ShareableFieldKey } from "./types";

const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Creates a new share token for the user, revoking any existing active tokens first.
 * Returns the new token record.
 */
export async function createShareToken(
  userId: string,
  fields: ShareableFieldKey[],
) {
  // Revoke all active tokens for this user
  await db.shareToken.updateMany({
    where: { userId, revoked: false },
    data: { revoked: true },
  });

  const expiresAt = new Date(Date.now() + TTL_MS);

  return db.shareToken.create({
    data: { userId, fields, expiresAt },
  });
}
