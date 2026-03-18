/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { prisma } from "@/lib/db";

export async function ensureConversationForUser(userId: string) {
  return prisma.conversation.upsert({
    where: { userId },
    create: {
      userId,
    },
    update: {},
  });
}
