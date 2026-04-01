/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { db } from "@/lib/db";
import {
  assertOwnedLabelIds,
  labelOptionSelect,
  toLabelOptionRecord,
} from "@/lib/labels/shared.logic";
import type { KnowledgeDocumentSummary } from "./list.logic";

export interface UpdateKnowledgeDocumentInput {
  labelIds?: string[];
}

export async function updateKnowledgeDocument(
  userId: string,
  documentId: string,
  input: UpdateKnowledgeDocumentInput,
): Promise<KnowledgeDocumentSummary | null> {
  const existing = await db.knowledgeDocument.findUnique({
    where: { id: documentId },
    select: { userId: true },
  });

  if (!existing || existing.userId !== userId) {
    return null;
  }

  const labelIds =
    input.labelIds !== undefined
      ? await assertOwnedLabelIds(userId, input.labelIds)
      : undefined;

  const row = await db.knowledgeDocument.update({
    where: { id: documentId },
    data: {
      ...(labelIds !== undefined && {
        labelLinks: {
          deleteMany: {},
          create: labelIds.map((labelId) => ({ labelId })),
        },
      }),
    },
    select: {
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
    },
  });

  return {
    id: row.id,
    name: row.name,
    charCount: row.charCount,
    labels: row.labelLinks.map((link) => toLabelOptionRecord(link.label)),
    createdAt: row.createdAt,
  };
}
