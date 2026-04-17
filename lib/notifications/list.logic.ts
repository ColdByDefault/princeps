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
 * Returns all non-dismissed notifications for the user, newest first.
 * Maximum 50 records — notifications are ephemeral by design.
 */
export async function listNotifications(
  userId: string,
): Promise<NotificationRecord[]> {
  const rows = await db.notification.findMany({
    where: { userId, dismissed: false },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: NOTIFICATION_SELECT,
  });

  return rows.map(toNotificationRecord);
}
