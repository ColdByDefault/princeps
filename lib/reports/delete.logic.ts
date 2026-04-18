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

/**
 * Deletes a single report. Only the owning user may delete (userId in where).
 * Returns true if deleted, false if not found or not owned.
 */
export async function deleteReport(
  userId: string,
  reportId: string,
): Promise<boolean> {
  const { count } = await db.assistantReport.deleteMany({
    where: { id: reportId, userId },
  });
  return count > 0;
}

/**
 * Deletes all reports for a user.
 */
export async function deleteAllReports(userId: string): Promise<number> {
  const { count } = await db.assistantReport.deleteMany({
    where: { userId },
  });
  return count;
}
