/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { db } from "@/lib/db";
import type { AssistantReport } from "@/lib/generated/prisma/client";
import type { Prisma } from "@/lib/generated/prisma/client";

export type CreateReportInput = {
  userId: string;
  toolsCalled: string[];
  summary: string;
};

export async function createReport(
  input: CreateReportInput,
): Promise<AssistantReport> {
  const data: Prisma.AssistantReportUncheckedCreateInput = {
    userId: input.userId,
    toolsCalled: input.toolsCalled as Prisma.InputJsonValue,
    summary: input.summary,
  };

  return db.assistantReport.create({ data });
}
