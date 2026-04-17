/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * SPDX-License-Identifier: Elastic-2.0
 */

import "server-only";

import { db } from "@/lib/db";
import type { UpdateProfileInput } from "./schemas";

export type UpdateProfileResult =
  | { ok: true; name: string | null; username: string | null }
  | { ok: false; error: string };

export async function updateProfile(
  userId: string,
  input: UpdateProfileInput,
): Promise<UpdateProfileResult> {
  const { name, username } = input;

  if (!name && !username) {
    return { ok: false, error: "Nothing to update." };
  }

  if (username) {
    const existing = await db.user.findFirst({
      where: { username: username.toLowerCase(), NOT: { id: userId } },
      select: { id: true },
    });
    if (existing) {
      return { ok: false, error: "Username is already taken." };
    }
  }

  const updated = await db.user.update({
    where: { id: userId },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(username !== undefined
        ? { username: username.toLowerCase(), displayUsername: username }
        : {}),
    },
    select: { name: true, username: true },
  });

  return { ok: true, name: updated.name, username: updated.username };
}
