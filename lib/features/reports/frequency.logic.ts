/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version canary-v1.1.4
 * @since canary-v1.1.4
 */

import "server-only";

import { db } from "@/lib/core/db";
import type { ToolFrequencyData } from "@/types/api";

/**
 * Aggregates tool call frequency across all sessions for a user.
 * Returns the top 10 tools by call count, the total call count,
 * and the number of sessions that included at least one tool call.
 */
export async function getToolFrequency(
  userId: string,
): Promise<ToolFrequencyData> {
  const rows = await db.assistantReport.findMany({
    where: { userId },
    select: { toolsCalled: true },
  });

  const counts = new Map<string, number>();
  let total = 0;

  for (const row of rows) {
    const tools = Array.isArray(row.toolsCalled)
      ? (row.toolsCalled as string[])
      : [];
    for (const tool of tools) {
      counts.set(tool, (counts.get(tool) ?? 0) + 1);
      total++;
    }
  }

  const top = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([tool, count]) => ({ tool, count }));

  return { top, total, sessionCount: rows.length };
}
