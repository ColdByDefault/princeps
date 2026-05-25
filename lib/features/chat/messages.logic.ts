/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version canary-v1.1.10
 * @since beta
 */

import "server-only";

import { db } from "@/lib/core/db";

export async function getChatMessages(chatId: string, userId: string) {
  const chat = await db.chat.findFirst({
    where: { id: chatId, userId },
    select: { id: true, title: true, activeSkillId: true },
  });

  if (!chat) return null;

  const messages = await db.chatMessage.findMany({
    where: { chatId },
    orderBy: { createdAt: "asc" },
    take: 40,
    select: {
      id: true,
      role: true,
      content: true,
      createdAt: true,
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

export async function saveAssistantMessage(chatId: string, content: string) {
  return db.chatMessage.create({
    data: { chatId, role: "assistant", content },
    select: { id: true },
  });
}

export async function touchChat(chatId: string) {
  await db.chat.update({
    where: { id: chatId },
    data: { updatedAt: new Date() },
  });
}
