/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version beta
 * @since beta
 * @module
 * @description
 */

import "server-only";

import { db } from "@/lib/db";
import type { ActionResult, ToolHandler } from "@/lib/tools/types";

async function handleGetUserInfo(userId: string): Promise<ActionResult> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      username: true,
      email: true,
      tier: true,
      role: true,
      timezone: true,
      createdAt: true,
    },
  });

  if (!user) {
    return { ok: false, error: "User not found." };
  }

  return {
    ok: true,
    data: {
      name: user.name ?? null,
      username: user.username ?? null,
      email: user.email,
      tier: user.tier,
      role: user.role,
      timezone: user.timezone,
      memberSince: user.createdAt.toISOString(),
    },
  };
}

export const profileHandlers: Record<string, ToolHandler> = {
  get_user_info: (userId) => handleGetUserInfo(userId),
};
