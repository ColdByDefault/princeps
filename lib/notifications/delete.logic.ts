/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * SPDX-License-Identifier: Elastic-2.0
 */

import "server-only";

import { db } from "@/lib/db";

/**
 * Soft-deletes a single notification (sets dismissed: true).
 * Verifies ownership in a single round-trip.
 */
export async function deleteNotification(
  userId: string,
  notificationId: string,
): Promise<{ ok: boolean }> {
  const { count } = await db.notification.updateMany({
    where: { id: notificationId, userId, dismissed: false },
    data: { dismissed: true },
  });

  return { ok: count > 0 };
}

/**
 * Soft-deletes all non-dismissed notifications for the user.
 */
export async function deleteAllNotifications(
  userId: string,
): Promise<{ count: number }> {
  const { count } = await db.notification.updateMany({
    where: { userId, dismissed: false },
    data: { dismissed: true },
  });

  return { count };
}
