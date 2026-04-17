/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * SPDX-License-Identifier: Elastic-2.0
 */

import "server-only";

import { db } from "@/lib/db";
import { REPORT_SELECT, toReportRecord } from "./shared.logic";
import type { AssistantReportRecord } from "./shared.logic";

/**
 * Lists all reports for a user, newest first.
 */
export async function listReports(
  userId: string,
): Promise<AssistantReportRecord[]> {
  const rows = await db.assistantReport.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: REPORT_SELECT,
  });

  return rows.map(toReportRecord);
}
