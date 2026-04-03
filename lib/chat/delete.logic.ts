/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { db } from "@/lib/db";

export async function deleteChat(chatId: string, userId: string) {
  const chat = await db.chat.findFirst({ where: { id: chatId, userId } });

  if (!chat) {
    return { ok: false } as const;
  }

  await db.chat.delete({ where: { id: chatId } });
  return { ok: true } as const;
}
