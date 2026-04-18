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
import { enforceChatsPerDay, getChatHistoryLimit } from "@/lib/tiers";

export type CreateChatResult =
  | { ok: true; chatId: string }
  | { ok: false; limitReached: true }
  | { ok: false; limitReached: false; error: string };

export async function createChat(userId: string): Promise<CreateChatResult> {
  // Check daily creation limit
  const daily = await enforceChatsPerDay(userId);
  if (!daily.allowed) {
    return { ok: false, limitReached: true };
  }

  // Check history total
  const [limit, total] = await Promise.all([
    getChatHistoryLimit(userId),
    db.chat.count({ where: { userId } }),
  ]);

  if (total >= limit) {
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
 */
export async function setInitialTitle(chatId: string, firstMessage: string) {
  const title = firstMessage.trim().slice(0, 60) || "New chat";
  await db.chat.update({ where: { id: chatId }, data: { title } });
}

/**
 * Returns the most recent chat id for the user, creating one if none exist.
 * Returns null only when the limit is reached and no chats exist.
 */
export async function getOrCreateFirstChat(
  userId: string,
): Promise<string | null> {
  const existing = await db.chat.findFirst({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    select: { id: true },
  });

  if (existing) return existing.id;

  const result = await createChat(userId);
  return result.ok ? result.chatId : null;
}
