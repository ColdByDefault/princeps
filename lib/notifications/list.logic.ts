/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { db } from "@/lib/db";
import type { Notification } from "@/lib/generated/prisma/client";

const PAGE_SIZE = 20;

export async function listNotifications(
  userId: string,
  page = 0,
): Promise<Notification[]> {
  return db.notification.findMany({
    where: { userId, dismissed: false },
    orderBy: { createdAt: "desc" },
    skip: page * PAGE_SIZE,
    take: PAGE_SIZE,
  });
}
