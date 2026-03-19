/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { db } from "@/lib/db";
import { CHAT_LIMIT } from "@/types/chat";

export type CreateChatResult =
  | { ok: true; chatId: string }
  | { ok: false; limitReached: true }
  | { ok: false; limitReached: false; error: string };

export async function createChat(userId: string): Promise<CreateChatResult> {
  const count = await db.chat.count({ where: { userId } });

  if (count >= CHAT_LIMIT) {
    return { ok: false, limitReached: true };
  }

  const chat = await db.chat.create({
    data: { userId, title: "New chat" },
    select: { id: true },
  });

  return { ok: true, chatId: chat.id };
}

/**
 * Auto-title a chat from the first user message (truncated to 60 chars).
 * Called after the first message is saved.
 */
export async function setInitialTitle(chatId: string, firstMessage: string) {
  const title = firstMessage.trim().slice(0, 60) || "New chat";

  await db.chat.update({
    where: { id: chatId },
    data: { title },
  });
}
