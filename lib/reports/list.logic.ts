/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { db } from "@/lib/db";

export interface ReportRecord {
  id: string;
  toolsCalled: string[];
  summary: string;
  createdAt: Date;
}

/**
 * Returns all assistant reports for the given user, newest first.
 */
export async function listReports(userId: string): Promise<ReportRecord[]> {
  const rows = await db.assistantReport.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      toolsCalled: true,
      summary: true,
      createdAt: true,
    },
  });

  return rows.map((r) => ({
    id: r.id,
    toolsCalled: Array.isArray(r.toolsCalled)
      ? (r.toolsCalled as string[])
      : [],
    summary: r.summary,
    createdAt: r.createdAt,
  }));
}
