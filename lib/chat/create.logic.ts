/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { db } from "@/lib/db";
import { getPlanLimits } from "@/types/billing";
import { incrementChatDailyCounter } from "@/lib/billing/enforce.logic";

export type CreateChatResult =
  | { ok: true; chatId: string }
  | { ok: false; limitReached: true }
  | { ok: false; limitReached: false; error: string };

export async function createChat(userId: string): Promise<CreateChatResult> {
  const today = new Date().toISOString().slice(0, 10);

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { tier: true, chatsDailyCount: true, chatsDailyDate: true },
  });

  if (!user) {
    return { ok: false, limitReached: false, error: "User not found." };
  }

  const limits = getPlanLimits(user.tier);

  // Check daily creation limit (counts even deleted chats)
  const dailyCount = user.chatsDailyDate === today ? user.chatsDailyCount : 0;
  if (dailyCount >= limits.chatsPerDay) {
    return { ok: false, limitReached: true };
  }

  // Check total history limit (live count of existing chats)
  const totalCount = await db.chat.count({ where: { userId } });
  if (totalCount >= limits.chatHistoryTotal) {
    return { ok: false, limitReached: true };
  }

  const chat = await db.chat.create({
    data: { userId, title: "New chat" },
    select: { id: true },
  });

  await incrementChatDailyCounter(userId);

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

/**
 * Returns the most recent chat id for the user, creating a new one if none
 * exist. Returns null only when the chat limit is reached and no chats exist
 * (practically impossible on first visit).
 */
export async function getOrCreateFirstChat(
  userId: string,
): Promise<string | null> {
  const chats = await db.chat.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    take: 1,
    select: { id: true },
  });

  if (chats.length > 0) {
    return chats[0].id;
  }

  const result = await createChat(userId);

  return result.ok ? result.chatId : null;
}
