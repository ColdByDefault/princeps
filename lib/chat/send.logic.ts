/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { prisma } from "@/lib/db";
import { ensureConversationForUser } from "@/lib/chat/conversation.logic";
import { buildChatPrompt } from "@/lib/chat/prompt.logic";
import { sendChatCompletion } from "@/lib/chat/provider.logic";
import {
  conversationSelect,
  type ProviderMessage,
} from "@/lib/chat/shared.logic";

export async function sendConversationMessage(userId: string, message: string) {
  const conversation = await ensureConversationForUser(userId);
  const existingMessages = await prisma.conversationMessage.findMany({
    where: {
      conversationId: conversation.id,
    },
    orderBy: {
      createdAt: "asc",
    },
    take: 12,
    select: {
      role: true,
      content: true,
    },
  });

  const { prompt, sources } = await buildChatPrompt({
    history: existingMessages,
    message,
    userId,
  });

  const providerMessages: ProviderMessage[] = [
    { role: "system", content: prompt },
    ...existingMessages,
    { role: "user", content: message },
  ];

  const reply = await sendChatCompletion(providerMessages);

  await prisma.$transaction(async (tx) => {
    await tx.conversationMessage.createMany({
      data: [
        {
          conversationId: conversation.id,
          role: "user",
          content: message,
        },
        {
          conversationId: conversation.id,
          role: "assistant",
          content: reply,
        },
      ],
    });

    await tx.conversation.update({
      where: { id: conversation.id },
      data: {
        lastMessageAt: new Date(),
      },
    });
  });

  const updatedConversation = await prisma.conversation.findUniqueOrThrow({
    where: { id: conversation.id },
    select: conversationSelect,
  });

  return {
    conversation: updatedConversation,
    reply,
    sources,
  };
}
