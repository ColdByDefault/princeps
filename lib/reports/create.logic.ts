/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { db } from "@/lib/db";
import { createReportSchema, type CreateReportInput } from "./schemas";
import { REPORT_SELECT, toReportRecord } from "./shared.logic";
import type { AssistantReportRecord } from "./shared.logic";
import type { Prisma } from "@/prisma/generated/prisma/client";

const TOOL_PLURAL = (n: number) => (n === 1 ? "tool" : "tools");

/**
 * Creates a new AssistantReport row.
 * Only called from server-side stream routes — never exposed to the user directly.
 * Returns null if validation fails (non-critical; should not throw).
 */
export async function createReport(
  userId: string,
  input: CreateReportInput,
): Promise<AssistantReportRecord | null> {
  const parsed = createReportSchema.safeParse(input);
  if (!parsed.success) return null;

  const { toolsCalled, toolCallCount, tokenUsage, details } = parsed.data;

  const row = await db.assistantReport.create({
    data: {
      userId,
      toolsCalled: toolsCalled as unknown as Prisma.InputJsonValue,
      toolCallCount,
      tokenUsage,
      details: details as unknown as Prisma.InputJsonValue,
    },
    select: REPORT_SELECT,
  });

  const record = toReportRecord(row);

  // Fire-and-forget system notification — never blocks or throws.
  _fireReportNotification(
    userId,
    row.id,
    record.toolCallCount,
    record.tokenUsage,
  );

  return record;
}

function _fireReportNotification(
  userId: string,
  reportId: string,
  toolCallCount: number,
  tokenUsage: number,
): void {
  const body = `${toolCallCount} ${TOOL_PLURAL(toolCallCount)} called · ${tokenUsage} tokens used`;
  db.notification
    .create({
      data: {
        userId,
        category: "report_generated",
        source: "system",
        title: "Report generated",
        body,
        metadata: { reportId },
      },
    })
    .catch(() => {});
}
