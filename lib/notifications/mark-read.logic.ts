/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * SPDX-License-Identifier: Elastic-2.0
 */

import "server-only";

import { db } from "@/lib/db";
import { NOTIFICATION_SELECT, toNotificationRecord } from "./shared.logic";
import type { NotificationRecord } from "@/types/api";

/**
 * Marks a single notification as read.
 * Verifies ownership before updating.
 */
export async function markNotificationRead(
  userId: string,
  notificationId: string,
): Promise<NotificationRecord | null> {
  const existing = await db.notification.findFirst({
    where: { id: notificationId, userId },
  });

  if (!existing) return null;

  const updated = await db.notification.update({
    where: { id: notificationId },
    data: { read: true },
    select: NOTIFICATION_SELECT,
  });

  return toNotificationRecord(updated);
}

/**
 * Marks all non-dismissed notifications as read for the user.
 */
export async function markAllNotificationsRead(
  userId: string,
): Promise<{ count: number }> {
  const { count } = await db.notification.updateMany({
    where: { userId, dismissed: false, read: false },
    data: { read: true },
  });

  return { count };
}
