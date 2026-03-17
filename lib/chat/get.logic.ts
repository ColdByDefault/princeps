/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { prisma } from "@/lib/db";
import { ensureConversationForUser } from "@/lib/chat/conversation.logic";
import { conversationSelect } from "@/lib/chat/shared.logic";

export async function getConversation(userId: string) {
  await ensureConversationForUser(userId);

  return prisma.conversation.findUniqueOrThrow({
    where: { userId },
    select: conversationSelect,
  });
}
