/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { db } from "@/lib/db";

export const CHAT_LIMIT = 10;

export async function listChats(userId: string) {
  return db.chat.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}
