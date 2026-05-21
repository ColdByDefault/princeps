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

import type { MemoryEntryRecord } from "@/types/api";

export const MEMORY_ENTRY_SELECT = {
  id: true,
  key: true,
  value: true,
  source: true,
  createdAt: true,
  updatedAt: true,
} as const;

type MemoryEntryRow = {
  id: string;
  key: string;
  value: string;
  source: string;
  createdAt: Date;
  updatedAt: Date;
};

export function toMemoryEntryRecord(row: MemoryEntryRow): MemoryEntryRecord {
  return {
    id: row.id,
    key: row.key,
    value: row.value,
    source: row.source,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
