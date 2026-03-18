/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { prisma } from "@/lib/db";
import { ensureConversationForUser } from "@/lib/chat/conversation.logic";
import { buildChatPrompt } from "@/lib/chat/prompt.logic";
import {
  sendChatCompletion,
  streamChatCompletion,
} from "@/lib/chat/provider.logic";
import {
  conversationSelect,
  type ProviderMessage,
} from "@/lib/chat/shared.logic";

async function buildConversationRequest(userId: string, message: string) {
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
  const history = existingMessages.map((entry) => ({
    role: entry.role as "user" | "assistant",
    content: entry.content,
  }));

  const { prompt, sources } = await buildChatPrompt({
    history,
    message,
    userId,
  });

  const providerMessages: ProviderMessage[] = [
    { role: "system", content: prompt },
    ...history,
    { role: "user", content: message },
  ];

  return {
    conversationId: conversation.id,
    providerMessages,
    sources,
  };
}

async function persistConversationReply(input: {
  conversationId: string;
  message: string;
  reply: string;
}) {
  await prisma.$transaction(async (tx) => {
    await tx.conversationMessage.createMany({
      data: [
        {
          conversationId: input.conversationId,
          role: "user",
          content: input.message,
        },
        {
          conversationId: input.conversationId,
          role: "assistant",
          content: input.reply,
        },
      ],
    });

    await tx.conversation.update({
      where: { id: input.conversationId },
      data: {
        lastMessageAt: new Date(),
      },
    });
  });

  return prisma.conversation.findUniqueOrThrow({
    where: { id: input.conversationId },
    select: conversationSelect,
  });
}

export async function sendConversationMessage(userId: string, message: string) {
  const { conversationId, providerMessages, sources } =
    await buildConversationRequest(userId, message);

  const reply = await sendChatCompletion(providerMessages);

  const updatedConversation = await persistConversationReply({
    conversationId,
    message,
    reply,
  });

  return {
    conversation: updatedConversation,
    reply,
    sources,
  };
}

export async function streamConversationMessage(
  userId: string,
  message: string,
  onChunk: (chunk: string) => void,
) {
  const { conversationId, providerMessages, sources } =
    await buildConversationRequest(userId, message);

  const reply = await streamChatCompletion(providerMessages, onChunk);

  const updatedConversation = await persistConversationReply({
    conversationId,
    message,
    reply,
  });

  return {
    conversation: updatedConversation,
    reply,
    sources,
  };
}
