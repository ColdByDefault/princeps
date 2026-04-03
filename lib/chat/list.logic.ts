/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { db } from "@/lib/db";
import { getChatHistoryLimit } from "@/lib/tiers";

export async function listChats(userId: string) {
  const limit = await getChatHistoryLimit(userId);

  return db.chat.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    take: limit,
    select: {
      id: true,
      title: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}
