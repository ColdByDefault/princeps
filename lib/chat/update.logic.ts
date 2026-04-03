/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { db } from "@/lib/db";

export async function renameChat(
  chatId: string,
  userId: string,
  title: string,
) {
  const trimmed = title.trim().slice(0, 80);

  if (!trimmed) {
    return { ok: false, error: "Title cannot be empty" } as const;
  }

  const chat = await db.chat.findFirst({ where: { id: chatId, userId } });

  if (!chat) {
    return { ok: false, error: "Not found" } as const;
  }

  await db.chat.update({ where: { id: chatId }, data: { title: trimmed } });
  return { ok: true } as const;
}
