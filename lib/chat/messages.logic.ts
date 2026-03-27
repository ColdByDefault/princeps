/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { db } from "@/lib/db";

/** Returns the last 40 messages for a chat in chronological order. */
export async function getChatMessages(chatId: string, userId: string) {
  // Verify the chat belongs to the user.
  const chat = await db.chat.findFirst({
    where: { id: chatId, userId },
    select: { id: true, title: true },
  });

  if (!chat) {
    return null;
  }

  const messages = await db.chatMessage.findMany({
    where: { chatId },
    orderBy: { createdAt: "asc" },
    take: 40,
    select: {
      id: true,
      role: true,
      content: true,
      createdAt: true,
      // thinking is intentionally excluded from the client payload
    },
  });

  return { chat, messages };
}

export async function saveUserMessage(chatId: string, content: string) {
  return db.chatMessage.create({
    data: { chatId, role: "user", content },
    select: { id: true },
  });
}

export async function saveAssistantMessage(
  chatId: string,
  content: string,
  thinking: string | null,
) {
  return db.chatMessage.create({
    data: { chatId, role: "assistant", content, thinking },
    select: { id: true },
  });
}

/** Touch updatedAt on the chat so it sorts to the top of the list. */
export async function touchChat(chatId: string) {
  await db.chat.update({
    where: { id: chatId },
    data: { updatedAt: new Date() },
  });
}
