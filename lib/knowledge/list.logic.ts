/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { db } from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";
import {
  labelOptionSelect,
  toLabelOptionRecord,
} from "@/lib/labels/shared.logic";
import type { LabelOptionRecord } from "@/types/api";

export interface KnowledgeDocumentSummary {
  id: string;
  name: string;
  charCount: number;
  labels: LabelOptionRecord[];
  createdAt: Date;
}

const knowledgeDocumentSelect = {
  id: true,
  name: true,
  charCount: true,
  createdAt: true,
  labelLinks: {
    select: {
      label: {
        select: labelOptionSelect,
      },
    },
  },
} satisfies Prisma.KnowledgeDocumentSelect;

/**
 * Returns all KnowledgeDocument records for the given user,
 * ordered newest first.
 */
export async function listKnowledgeDocuments(
  userId: string,
): Promise<KnowledgeDocumentSummary[]> {
  const rows = await db.knowledgeDocument.findMany({
    where: { userId },
    select: knowledgeDocumentSelect,
    orderBy: { createdAt: "desc" },
  });

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    charCount: row.charCount,
    labels: row.labelLinks.map((link) => toLabelOptionRecord(link.label)),
    createdAt: row.createdAt,
  }));
}
