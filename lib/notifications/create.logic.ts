/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { db } from "@/lib/db";
import type { Notification } from "@/lib/generated/prisma/client";
import { type Prisma } from "@/lib/generated/prisma/client";

type CreateInput = {
  userId: string;
  category: string;
  source: string;
  title: string;
  body: string;
  metadata?: Record<string, unknown>;
};

export async function createNotification(
  input: CreateInput,
): Promise<Notification> {
  const data: Prisma.NotificationUncheckedCreateInput = {
    userId: input.userId,
    category: input.category,
    source: input.source,
    title: input.title,
    body: input.body,
  };
  if (input.metadata !== undefined) {
    data.metadata = input.metadata as Prisma.InputJsonValue;
  }

  return db.notification.create({ data });
}
