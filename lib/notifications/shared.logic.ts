/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version beta
 * @since beta
 * @module
 * @description
 */

import "server-only";

import { db } from "@/lib/db";
import type { NotificationRecord } from "@/types/api";

export const NOTIFICATION_SELECT = {
  id: true,
  userId: true,
  category: true,
  source: true,
  title: true,
  body: true,
  read: true,
  dismissed: true,
  metadata: true,
  createdAt: true,
} as const;

type NotificationRow = {
  id: string;
  userId: string;
  category: string;
  source: string;
  title: string;
  body: string;
  read: boolean;
  dismissed: boolean;
  metadata: unknown;
  createdAt: Date;
};

export function toNotificationRecord(row: NotificationRow): NotificationRecord {
  return {
    id: row.id,
    userId: row.userId,
    category: row.category,
    source: row.source,
    title: row.title,
    body: row.body,
    read: row.read,
    dismissed: row.dismissed,
    metadata: (row.metadata as Record<string, unknown> | null) ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

/** Returns today's UTC date string "YYYY-MM-DD". */
export function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Checks whether a daily greeting already exists for today (UTC).
 * Used to enforce the once-per-day limit.
 */
export async function findTodayGreeting(
  userId: string,
): Promise<NotificationRow | null> {
  const today = todayUtc();

  const rows = await db.notification.findMany({
    where: { userId, category: "daily_greeting" },
    select: NOTIFICATION_SELECT,
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  const match = rows.find((r) => {
    const meta = r.metadata as Record<string, unknown> | null;
    return meta?.date === today;
  });

  return match ?? null;
}
