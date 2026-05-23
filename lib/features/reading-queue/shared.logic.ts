/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version canary-v1.1.4
 */

import "server-only";

import type { ReadingItemRecord } from "@/types/api";

export const READING_ITEM_SELECT = {
  id: true,
  url: true,
  title: true,
  aiSummary: true,
  relevanceScore: true,
  status: true,
  addedAt: true,
  readAt: true,
  updatedAt: true,
} as const;

type ReadingItemRow = {
  id: string;
  url: string;
  title: string | null;
  aiSummary: string | null;
  relevanceScore: number | null;
  status: string;
  addedAt: Date;
  readAt: Date | null;
  updatedAt: Date;
};

export function toReadingItemRecord(row: ReadingItemRow): ReadingItemRecord {
  return {
    id: row.id,
    url: row.url,
    title: row.title,
    aiSummary: row.aiSummary,
    relevanceScore: row.relevanceScore,
    status: row.status,
    addedAt: row.addedAt.toISOString(),
    readAt: row.readAt?.toISOString() ?? null,
    updatedAt: row.updatedAt.toISOString(),
  };
}
