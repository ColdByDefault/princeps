/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version beta
 * @since beta
 */

import "server-only";

import { db } from "@/lib/core/db";
import { getChatHistoryLimit } from "@/lib/platform/tiers";

export async function listChats(userId: string) {
  const limit = await getChatHistoryLimit(userId);

  return db.chat
    .findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: limit,
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { messages: true } },
      },
    })
    .then((rows) =>
      rows.map((r) => ({
        id: r.id,
        title: r.title,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
        messageCount: r._count.messages,
      })),
    );
}
